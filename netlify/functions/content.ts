import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { defaultContent, sanitizeContent } from "../../shared/content.js";
const COOKIE = "bestdry_admin";
const STORE = "bestdry-site-content";
const key = process.env.ADMIN_PASSWORD?.trim() ?? "";
const hash = (s: string) => createHmac("sha256", key).update(s).digest();
function signed(payload: string) {
  return `${payload}.${hash(payload).toString("base64url")}`;
}
function verifyToken(token: string | undefined) {
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
  const sig = hash(p);
  return (
    b.length === sig.length &&
    timingSafeEqual(b, sig) &&
    Number(p.split(":")[1]) > Date.now()
  );
}
function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
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
  if (!process.env.NETLIFY) {
    try {
      const fs = await import("node:fs/promises");
      return sanitizeContent(
        JSON.parse(await fs.readFile(".local-content/site.json", "utf8"))
      );
    } catch {
      return defaultContent;
    }
  }
  return sanitizeContent(
    await getStore({ name: STORE, consistency: "strong" }).get("site", {
      type: "json",
    })
  );
}
function visitorContent(data: Awaited<ReturnType<typeof read>>) {
  return {
    ...data,
    noticePosts: data.noticePosts.filter(post => post.published),
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
  if (!url.pathname.startsWith("/api/admin/"))
    return json({ error: "Not found" }, 404);
  if (!key)
    return json(
      { error: "Netlify 환경변수 ADMIN_PASSWORD 설정이 필요합니다." },
      503
    );
  const origin = req.headers.get("origin");
  if (origin && origin !== url.origin)
    return json({ error: "요청 출처를 확인해 주세요." }, 403);
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map(x => x.trim())
    .find(x => x.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "잘못된 요청입니다." }, 400);
    }
    if (
      typeof body.password !== "string" ||
      body.password.length > 512 ||
      !timingSafeEqual(hash(body.password), hash(key))
    )
      return json({ error: "관리자 비밀번호를 확인해 주세요." }, 401);
    const nonce = randomBytes(16).toString("base64url");
    return json({ ok: true }, 200, {
      "set-cookie": `${COOKIE}=${signed(`${nonce}:${Date.now() + 8 * 60 * 60 * 1000}`)}; Path=/api/admin; Max-Age=28800; HttpOnly; Secure; SameSite=None`,
    });
  }
  if (url.pathname === "/api/admin/logout" && req.method === "POST")
    return json({ ok: true }, 200, {
      "set-cookie": `${COOKIE}=; Path=/api/admin; Max-Age=0; HttpOnly; Secure; SameSite=None`,
    });
  if (!verifyToken(cookie)) return json({ error: "로그인이 필요합니다." }, 401);
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
    try {
      if (!process.env.NETLIFY) {
        const { writeFile, mkdir } = await import("node:fs/promises");
        await mkdir(".local-content", { recursive: true });
        await writeFile(
          ".local-content/site.json",
          JSON.stringify(data, null, 2),
          "utf8"
        );
      } else
        await getStore({ name: STORE, consistency: "strong" }).setJSON(
          "site",
          data
        );
      return json({ ok: true, content: data });
    } catch {
      return json(
        { error: "저장 실패. 배포 상태 또는 Netlify Blobs를 확인해 주세요." },
        503
      );
    }
  }
  return json({ error: "Not found" }, 404);
};
export const config = {
  path: ["/api/site-content", "/api/admin/*"],
  preferStatic: false,
  rateLimit: {
    action: "rate_limit",
    aggregateBy: "ip",
    windowSize: 60,
    windowLimit: 30,
  },
};
