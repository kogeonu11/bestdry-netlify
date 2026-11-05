import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getStore } from "@netlify/blobs";

const deriveKey = promisify(scrypt);
// "b"로 시작하는 키는 공개 게시판 글, 그 외는 이전 비공개 문의입니다.
const idPattern = /^b?\d{13}-[a-f0-9]{32}$/;
const isBoardId = (id: string) => id.startsWith("b");
const PAGE_SIZE = 15;

type Inquiry = {
  id: string;
  title: string;
  body: string;
  author?: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  salt: string;
  hash: string;
};

export type InquiryAction =
  | "create"
  | "list"
  | "detail"
  | "reply"
  | "remove" // 작성자 본인 삭제 (비밀번호 확인)
  | "adminRemove"; // 관리자 삭제 (로그인 쿠키는 호출 측에서 검증)

function visible({ salt: _salt, hash: _hash, ...inquiry }: Inquiry) {
  return inquiry;
}

function field(value: unknown, max: number) {
  return typeof value === "string" && value.length <= max ? value.trim() : "";
}

export async function handleInquiry(
  req: Request,
  action: InquiryAction,
  json: (data: unknown, status?: number) => Response,
  options: { admin?: boolean } = {},
) {
  const isAdmin = Boolean(options.admin);
  try {
    const store = getStore({
      name: "bestdry-inquiries",
      consistency: "strong",
    });
    const url = new URL(req.url);

    if (action === "list") {
      const page = Math.max(1, Math.floor(Number(url.searchParams.get("page"))) || 1);
      const { blobs } = await store.list();
      // 일반 방문자에게는 공개 게시판 글만, 관리자에게는 이전 비공개 문의까지 보여 준다.
      const keys = blobs
        .map((blob) => blob.key)
        .filter((id) => idPattern.test(id) && (isAdmin || isBoardId(id)))
        .sort((x, y) => (x.replace(/^b/, "") < y.replace(/^b/, "") ? 1 : -1));
      const total = keys.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const start = (page - 1) * PAGE_SIZE;
      const rows = await Promise.all(
        keys
          .slice(start, start + PAGE_SIZE)
          .map(
            (id) => store.get(id, { type: "json" }) as Promise<Inquiry | null>,
          ),
      );
      const items = rows.flatMap((row, index) =>
        row
          ? [
              {
                id: row.id,
                no: total - start - index,
                title: row.title,
                author: row.author || "익명",
                createdAt: row.createdAt,
                answered: Boolean(row.reply),
                ...(isAdmin && !isBoardId(row.id) && { legacy: true }),
              },
            ]
          : [],
      );
      return json({ items, total, page, pages });
    }

    if (action === "detail") {
      const id = url.searchParams.get("id");
      if (typeof id !== "string" || !idPattern.test(id))
        return json({ error: "게시글을 찾을 수 없습니다." }, 404);
      const inquiry = (await store.get(id, { type: "json" })) as Inquiry | null;
      if (!inquiry || (!isBoardId(id) && !isAdmin))
        return json({ error: "게시글을 찾을 수 없습니다." }, 404);
      return json(visible(inquiry));
    }

    if (action === "adminRemove") {
      const id = url.searchParams.get("id");
      if (typeof id !== "string" || !idPattern.test(id))
        return json({ error: "게시글을 찾을 수 없습니다." }, 404);
      await store.delete(id);
      return json({ ok: true });
    }

    const input = await req.json().catch(() => null);

    if (action === "create") {
      // 매크로 방지: 사람이 보지 못하는 함정 입력칸 + 최소 작성 시간
      if (typeof input?.website === "string" && input.website !== "")
        return json({ error: "등록할 수 없는 요청입니다." }, 400);
      const elapsed = Number(input?.elapsed);
      if (!Number.isFinite(elapsed) || elapsed < 3000)
        return json(
          { error: "너무 빠르게 등록되었습니다. 잠시 후 다시 시도해 주세요." },
          429,
        );
      const password = input?.password;
      if (
        typeof password !== "string" ||
        password.length < 4 ||
        password.length > 128 ||
        !password.trim()
      )
        return json({ error: "글 비밀번호를 4~128자로 입력해 주세요." }, 400);
      const title = field(input?.title, 100);
      const body = field(input?.body, 4000);
      const author = field(input?.author, 20);
      if (!title || !body || !author)
        return json({ error: "작성자, 제목, 내용을 확인해 주세요." }, 400);
      const id = `b${Date.now()}-${randomBytes(16).toString("hex")}`;
      const salt = randomBytes(16).toString("hex");
      const hash = ((await deriveKey(password, salt, 32)) as Buffer).toString(
        "hex",
      );
      const inquiry: Inquiry = {
        id,
        title,
        body,
        author,
        salt,
        hash,
        createdAt: new Date().toISOString(),
      };
      const saved = await store.setJSON(id, inquiry, { onlyIfNew: true });
      if (!saved.modified) throw new Error("Inquiry key already exists");
      return json({ id }, 201);
    }

    const id = input?.id;
    const denied = () =>
      json({ error: "게시글을 찾을 수 없거나 비밀번호가 다릅니다." }, 404);
    if (typeof id !== "string" || !idPattern.test(id)) return denied();
    const entry = await store.getWithMetadata(id, { type: "json" });
    if (!entry) return denied();
    const inquiry = entry.data as Inquiry;

    if (action === "remove") {
      const password = input?.password;
      if (typeof password !== "string" || password.length > 128)
        return denied();
      const hash = (await deriveKey(password, inquiry.salt, 32)) as Buffer;
      const stored = Buffer.from(inquiry.hash, "hex");
      if (hash.length !== stored.length || !timingSafeEqual(hash, stored))
        return denied();
      await store.delete(id);
      return json({ ok: true });
    }

    // reply (관리자 전용 — 호출 측에서 로그인 검증)
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
