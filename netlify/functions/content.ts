import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  defaultContent,
  maxNoticeImagesLength,
  publicNoticePost,
  sanitizeContent,
} from "../../shared/content.js";
import { handleInquiry } from "../lib/inquiries.js";
// SITE_ID is available in deployed Functions. NETLIFY also supports local Netlify tooling.
const useNetlifyBlobs = Boolean(process.env.SITE_ID || process.env.NETLIFY);
const COOKIE = "bestdry_admin";
const STORE = "bestdry-site-content";
const key = process.env.ADMIN_PASSWORD?.trim() ?? "";
const recoveryCode = process.env.ADMIN_RECOVERY_CODE?.trim() ?? "";
const adminEmail = process.env.ADMIN_RECOVERY_EMAIL?.trim();
const emailFrom = process.env.RECOVERY_FROM_EMAIL?.trim();
const emailKey = process.env.RESEND_API_KEY?.trim();
const emailCodeKey = "email-recovery";
type EmailCode = { hash: string; sentAt: number; expiresAt: number };
const credentialKey = "admin-credential";
const authStore = () =>
  getStore({
    name: "bestdry-admin-auth",
    consistency: "strong",
  });
type Credential = {
  salt: string;
  passwordHash: string;
  usedCodes: string[];
};
async function readCredential() {
  if (!useNetlifyBlobs) return null;
  const entry = await authStore().getWithMetadata(credentialKey, {
    type: "json",
  });
  if (entry && !entry.etag) throw new Error("Missing credential ETag");
  return entry ? { etag: entry.etag, data: entry.data as Credential } : null;
}
const digest = (value: string) => createHash("sha256").update(value).digest();
const passwordHash = (password: string, salt: string) =>
  scryptSync(password, salt, 32);
const sign = (payload: string, sessionKey: Buffer) =>
  createHmac("sha256", sessionKey).update(payload).digest();
function verifyToken(token: string | undefined, sessionKey: Buffer) {
  if (!key || !token) return false;
  const i = token.lastIndexOf(".");
  if (i < 1) return false;
  const p = token.slice(0, i);
  let b: Buffer;
  try {
    b = Buffer.from(token.slice(i + 1), "base64url");
  } catch {
    return false;
  }
  const sig = sign(p, sessionKey);
  return (
    b.length === sig.length &&
    timingSafeEqual(b, sig) &&
    Number(p.split(":")[1]) > Date.now()
  );
}
function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}
async function read() {
  if (!useNetlifyBlobs) {
    try {
      const fs = await import("node:fs/promises");
      return sanitizeContent(
        JSON.parse(await fs.readFile(".local-content/site.json", "utf8")),
      );
    } catch {
      return defaultContent;
    }
  }
  return sanitizeContent(
    await getStore({ name: STORE, consistency: "strong" }).get("site", {
      type: "json",
    }),
  );
}
async function sendRecoveryEmail() {
  if (!useNetlifyBlobs || !adminEmail || !emailFrom || !emailKey)
    return json({ error: "관리자 복구 이메일 설정이 필요합니다." }, 503);
  try {
    const store = authStore();
    const previous = await store.getWithMetadata(emailCodeKey, {
      type: "json",
    });
    if (previous && !previous.etag) throw new Error("Missing recovery ETag");
    const now = Date.now();
    if (previous && now - previous.data.sentAt < 60_000)
      return json({ error: "이메일은 1분에 한 번 요청할 수 있습니다." }, 429);
    const code = randomBytes(24).toString("base64url");
    const record: EmailCode = {
      hash: digest(code).toString("hex"),
      sentAt: now,
      expiresAt: now + 15 * 60_000,
    };
    const written = await store.setJSON(
      emailCodeKey,
      record,
      previous ? { onlyIfMatch: previous.etag } : { onlyIfNew: true },
    );
    if (!written.modified)
      return json({ error: "이미 이메일 발송 요청이 처리 중입니다." }, 429);
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [adminEmail],
        subject: "[세탁베스트드라이] 관리자 비밀번호 재설정",
        text: `관리자 화면의 비밀번호 찾기에서 아래 인증 코드를 입력하세요. 코드는 15분 동안 한 번만 사용할 수 있습니다.\n\n${code}\n\n요청하지 않았다면 이 메일을 무시하세요.`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!sent.ok) throw new Error("Email delivery request failed");
    return json({ ok: true });
  } catch {
    return json(
      { error: "인증 메일을 보내지 못했습니다. 1분 후 다시 시도해 주세요." },
      503,
    );
  }
}

function visitorContent(data: Awaited<ReturnType<typeof read>>) {
  return {
    ...data,
    noticePosts: data.noticePosts
      .filter((post) => post.published)
      .map(publicNoticePost),
  };
}
export default async (req: Request) => {
  const url = new URL(req.url);
  if (url.pathname === "/api/site-content" && req.method === "GET")
    try {
      return json(visitorContent(await read()));
    } catch {
      return json(visitorContent(defaultContent));
    }
  const imageId = /^\/api\/notice-image\/([A-Za-z0-9_-]{1,100})$/.exec(
    url.pathname,
  )?.[1];
  if (imageId && req.method === "GET") {
    try {
      const post = (await read()).noticePosts.find(
        (post) => post.id === imageId,
      );
      const parts =
        post?.published &&
        post.image?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (!parts) return json({ error: "Not found" }, 404);
      return new Response(new Uint8Array(Buffer.from(parts[2], "base64")), {
        headers: {
          "content-type": parts[1],
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      });
    } catch {
      return json({ error: "이미지를 불러올 수 없습니다." }, 503);
    }
  }
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin)
    return json({ error: "요청 출처를 확인해 주세요." }, 403);
  if (url.pathname === "/api/inquiries") {
    if (req.method === "GET")
      return handleInquiry(
        req,
        url.searchParams.has("id") ? "detail" : "list",
        json,
      );
    if (req.method === "POST") return handleInquiry(req, "create", json);
    if (req.method === "DELETE") return handleInquiry(req, "remove", json);
  }
  if (!url.pathname.startsWith("/api/admin/"))
    return json({ error: "Not found" }, 404);
  if (!key)
    return json(
      { error: "Netlify 환경변수 ADMIN_PASSWORD 설정이 필요합니다." },
      503,
    );
  if (url.pathname === "/api/admin/request-reset" && req.method === "POST")
    return sendRecoveryEmail();
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  let credential: Awaited<ReturnType<typeof readCredential>>;
  try {
    credential = await readCredential();
  } catch {
    return json({ error: "관리자 인증 정보를 불러올 수 없습니다." }, 503);
  }
  const sessionKey = credential
    ? sign(`reset-session:${credential.data.passwordHash}`, digest(key))
    : Buffer.from(key);
  const isLogin = url.pathname === "/api/admin/login";
  const isReset = url.pathname === "/api/admin/reset-password";
  if ((isLogin || isReset) && req.method === "POST") {
    const body = await req.json().catch(() => null);
    const password = body?.password;
    if (typeof password !== "string" || password.length > 512)
      return json({ error: "비밀번호 입력을 확인해 주세요." }, 400);

    if (isReset) {
      if (
        !useNetlifyBlobs ||
        typeof body.code !== "string" ||
        body.code.length > 512
      )
        return json({ error: "인증 코드를 확인해 주세요." }, 400);
      const codeHash = digest(body.code.trim());
      const codeId = codeHash.toString("hex");
      const isBackup =
        recoveryCode.length >= 32 &&
        timingSafeEqual(codeHash, digest(recoveryCode));
      let isEmail = false;
      if (!isBackup) {
        try {
          const pending = (await authStore().get(emailCodeKey, {
            type: "json",
          })) as EmailCode | null;
          isEmail = Boolean(
            pending &&
              pending.expiresAt > Date.now() &&
              timingSafeEqual(codeHash, Buffer.from(pending.hash, "hex")),
          );
        } catch {
          return json(
            { error: "인증 코드를 확인할 수 없습니다. 다시 시도해 주세요." },
            503,
          );
        }
      }
      if (
        (!isBackup && !isEmail) ||
        credential?.data.usedCodes.includes(codeId)
      )
        return json(
          {
            error: "인증 코드가 잘못되었거나 만료되었거나 이미 사용되었습니다.",
          },
          401,
        );
      if (
        password.length < 16 ||
        password.trim() !== password ||
        password === key ||
        timingSafeEqual(digest(password), codeHash)
      )
        return json(
          {
            error:
              "기존 초기 비밀번호나 복구 코드와 다른 16자 이상 비밀번호를 입력하세요. 앞뒤 공백은 사용할 수 없습니다.",
          },
          400,
        );
      const salt = randomBytes(16).toString("hex");
      try {
        const result = await authStore().setJSON(
          credentialKey,
          {
            salt,
            passwordHash: passwordHash(password, salt).toString("hex"),
            usedCodes: [...(credential?.data.usedCodes ?? []), codeId],
          } satisfies Credential,
          credential ? { onlyIfMatch: credential.etag } : { onlyIfNew: true },
        );
        if (!result.modified)
          return json(
            {
              error:
                "다른 재설정이 먼저 처리되었습니다. 상태를 다시 확인해 주세요.",
            },
            409,
          );
        return json({ ok: true });
      } catch {
        return json(
          {
            error:
              "비밀번호를 재설정하지 못했습니다. 잠시 후 다시 확인해 주세요.",
          },
          503,
        );
      }
    }

    const valid = credential
      ? timingSafeEqual(
          passwordHash(password, credential.data.salt),
          Buffer.from(credential.data.passwordHash, "hex"),
        )
      : timingSafeEqual(digest(password), digest(key));
    if (!valid) return json({ error: "관리자 비밀번호를 확인해 주세요." }, 401);
    const payload = `${randomBytes(16).toString("base64url")}:${Date.now() + 8 * 60 * 60 * 1000}`;
    return json({ ok: true }, 200, {
      "set-cookie": `${COOKIE}=${payload}.${sign(payload, sessionKey).toString("base64url")}; Path=/api/admin; Max-Age=28800; HttpOnly; Secure; SameSite=None`,
    });
  }
  if (url.pathname === "/api/admin/logout" && req.method === "POST")
    return json({ ok: true }, 200, {
      "set-cookie": `${COOKIE}=; Path=/api/admin; Max-Age=0; HttpOnly; Secure; SameSite=None`,
    });
  if (!verifyToken(cookie, sessionKey))
    return json({ error: "로그인이 필요합니다." }, 401);
  if (url.pathname === "/api/admin/inquiries" && req.method === "GET")
    return handleInquiry(
      req,
      url.searchParams.has("id") ? "detail" : "list",
      json,
      { admin: true },
    );
  if (url.pathname === "/api/admin/inquiries" && req.method === "PUT")
    return handleInquiry(req, "reply", json, { admin: true });
  if (url.pathname === "/api/admin/inquiries" && req.method === "DELETE")
    return handleInquiry(req, "adminRemove", json, { admin: true });
  if (url.pathname === "/api/admin/session" && req.method === "GET")
    return json({ ok: true });
  if (url.pathname === "/api/admin/content" && req.method === "GET")
    try {
      return json(await read());
    } catch {
      return json(defaultContent);
    }
  if (url.pathname === "/api/admin/content" && req.method === "PUT") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "JSON 형식이 올바르지 않습니다." }, 400);
    }
    const data = sanitizeContent(body);
    if (
      data.noticePosts.reduce(
        (sum, post) => sum + (post.image?.length ?? 0),
        0,
      ) > maxNoticeImagesLength
    )
      return json(
        {
          error:
            "공지 이미지 전체 용량이 한도를 초과했습니다. 기존 이미지를 일부 제거한 뒤 저장해 주세요.",
        },
        400,
      );
    try {
      if (!useNetlifyBlobs) {
        const { writeFile, mkdir } = await import("node:fs/promises");
        await mkdir(".local-content", { recursive: true });
        await writeFile(
          ".local-content/site.json",
          JSON.stringify(data, null, 2),
          "utf8",
        );
      } else
        await getStore({ name: STORE, consistency: "strong" }).setJSON(
          "site",
          data,
        );
      return json({ ok: true, content: data });
    } catch (error) {
      console.error("Site content save failed", {
        storage: useNetlifyBlobs ? "Netlify Blobs" : "local",
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      return json(
        { error: "저장 실패. 배포 상태 또는 Netlify Blobs를 확인해 주세요." },
        503,
      );
    }
  }
  return json({ error: "Not found" }, 404);
};
export const config = {
  path: [
    "/api/site-content",
    "/api/notice-image/:id",
    "/api/inquiries",
    "/api/admin/*",
  ],
  preferStatic: false,
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 30,
  },
};
