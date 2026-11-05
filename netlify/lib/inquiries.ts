import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getStore } from "@netlify/blobs";

const deriveKey = promisify(scrypt);
const idPattern = /^(?:\d{13}-[a-f0-9]{32}|\d{14}-[a-z](?!0000)\d{4})$/;
const receiptClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function receiptTimestamp(date: Date) {
  const parts = new Map(
    receiptClock.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return ["year", "month", "day", "hour", "minute", "second"]
    .map((part) => parts.get(part as Intl.DateTimeFormatPartTypes))
    .join("");
}
type Inquiry = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  salt: string;
  hash: string;
};

function visible({ salt: _salt, hash: _hash, ...inquiry }: Inquiry) {
  return inquiry;
}

function field(value: unknown, max: number) {
  return typeof value === "string" && value.length <= max ? value.trim() : "";
}

export async function handleInquiry(
  req: Request,
  action: "create" | "lookup" | "list" | "detail" | "reply",
  json: (data: unknown, status?: number) => Response,
) {
  try {
    const store = getStore({
      name: "bestdry-inquiries",
      consistency: "strong",
    });
    const url = new URL(req.url);
    if (action === "list") {
      const before = url.searchParams.get("before");
      if (before && !idPattern.test(before))
        return json({ error: "목록 요청이 올바르지 않습니다." }, 400);
      const { blobs } = await store.list();
      const keys = blobs
        .map((blob) => blob.key)
        .filter((id) => idPattern.test(id) && (!before || id < before))
        .sort()
        .reverse();
      const page = keys.slice(0, 20);
      const rows = await Promise.all(
        page.map(
          (id) => store.get(id, { type: "json" }) as Promise<Inquiry | null>,
        ),
      );
      return json({
        items: rows.flatMap((row) =>
          row
            ? [
                {
                  id: row.id,
                  title: row.title,
                  createdAt: row.createdAt,
                  answered: Boolean(row.reply),
                },
              ]
            : [],
        ),
        next: keys.length > page.length ? page.at(-1) : null,
      });
    }

    const input =
      action === "detail" ? null : await req.json().catch(() => null);
    const password = input?.password;
    if (action === "create" || action === "lookup") {
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128 ||
        !password.trim()
      )
        return json({ error: "문의 비밀번호를 8~128자로 입력해 주세요." }, 400);
    }
    if (action === "create") {
      const title = field(input?.title, 100);
      const body = field(input?.body, 4000);
      if (!title || !body)
        return json({ error: "제목과 내용을 확인해 주세요." }, 400);
      const receivedAt = new Date();
      const salt = randomBytes(16).toString("hex");
      const hash = ((await deriveKey(password, salt, 32)) as Buffer).toString(
        "hex",
      );
      const stamp = receiptTimestamp(receivedAt);
      for (let slot = 0; slot < 26 * 9999; slot++) {
        const letter = "abcdefghijklmnopqrstuvwxyz"[Math.floor(slot / 9999)];
        const number = String((slot % 9999) + 1).padStart(4, "0");
        const id = `${stamp}-${letter}${number}`;
        const inquiry: Inquiry = {
          id,
          title,
          body,
          salt,
          hash,
          createdAt: receivedAt.toISOString(),
        };
        // The conditional write allocates the number and stores the inquiry atomically.
        const saved = await store.setJSON(id, inquiry, { onlyIfNew: true });
        if (saved.modified) return json({ id }, 201);
      }
      return json(
        { error: "접수 요청이 많습니다. 잠시 후 다시 시도해 주세요." },
        503,
      );
    }

    const id =
      action === "detail"
        ? url.searchParams.get("id")
        : typeof input?.id === "string"
          ? input.id.trim().toLowerCase()
          : null;
    const denied = () =>
      json({ error: "접수번호와 비밀번호를 확인해 주세요." }, 404);
    if (typeof id !== "string" || !idPattern.test(id)) return denied();
    const entry = await store.getWithMetadata(id, { type: "json" });
    if (!entry) return denied();
    const inquiry = entry.data as Inquiry;
    if (action === "lookup") {
      const hash = (await deriveKey(password, inquiry.salt, 32)) as Buffer;
      if (!timingSafeEqual(hash, Buffer.from(inquiry.hash, "hex")))
        return denied();
    }
    if (action !== "reply") return json(visible(inquiry));

    const reply = field(input?.reply, 4000);
    if (!reply) return json({ error: "답변 내용을 입력해 주세요." }, 400);
    if (!entry.etag) throw new Error("Missing inquiry ETag");
    const answered = { ...inquiry, reply, repliedAt: new Date().toISOString() };
    const saved = await store.setJSON(id, answered, {
      onlyIfMatch: entry.etag,
    });
    if (!saved.modified)
      return json(
        {
          error:
            "문의가 변경되었습니다. 목록을 새로고침하고 다시 시도해 주세요.",
        },
        409,
      );
    return json(visible(answered));
  } catch (error) {
    console.error("Inquiry storage failed", {
      action,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { error: "문의를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      503,
    );
  }
}
