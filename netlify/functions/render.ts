import { getStore } from "@netlify/blobs";
import { defaultContent, sanitizeContent } from "../../shared/content.js";
const routes: Record<string, { title: string; description: string }> = {
  "/": { title: "", description: "" },
  "/about": {
    title: "업체 소개 · 세탁베스트드라이",
    description:
      "제주 제주시 외도동의 세탁베스트드라이를 소개합니다. 소중한 옷을 더 오래 입도록 정성껏 관리합니다.",
  },
  "/services": {
    title: "세탁 서비스 · 세탁베스트드라이",
    description:
      "의류, 셔츠와 정장, 코트와 침구 세탁. 품목별 서비스와 세탁 가능 여부를 확인하세요.",
  },
  "/guide": {
    title: "세탁 이용 안내 · 세탁베스트드라이",
    description:
      "제주 외도동 세탁베스트드라이 방문 접수부터 세탁물 수령까지의 이용 순서를 안내합니다.",
  },
  "/location": {
    title: "매장 안내 · 세탁베스트드라이",
    description:
      "제주시 우정로 13길 10, 102호(1층). 외도동 세탁베스트드라이의 위치, 연락처, 운영 시간.",
  },
  "/contact": {
    title: "고객 문의 · 세탁베스트드라이",
    description:
      "전화 문의, 지도 길찾기와 세탁 자주 묻는 질문을 확인하세요. 제주 외도동 세탁베스트드라이.",
  },
  "/notices": {
    title: "공지사항 · 세탁베스트드라이",
    description: "세탁베스트드라이에서 전하는 매장 안내와 최신 공지사항입니다.",
  },
  "/privacy": {
    title: "개인정보 처리방침 · 세탁베스트드라이",
    description: "세탁베스트드라이 홈페이지의 개인정보 처리방침.",
  },
  "/admin": {
    title: "관리자 로그인 · 세탁베스트드라이",
    description: "세탁베스트드라이 홈페이지 관리자 페이지.",
  },
};
async function load() {
  try {
    if (!process.env.NETLIFY) {
      const fs = await import("node:fs/promises");
      return sanitizeContent(
        JSON.parse(await fs.readFile(".local-content/site.json", "utf8"))
      );
    }
    return sanitizeContent(
      await getStore({
        name: "bestdry-site-content",
        consistency: "strong",
      }).get("site", { type: "json" })
    );
  } catch {
    return defaultContent;
  }
}
const esc = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
const plain = (value: string, max = 165) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};
const notFound = () =>
  new Response("Not Found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex",
    },
  });
export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const isDetail = /^\/notices\/[A-Za-z0-9_-]{1,100}$/.test(path);
  const id = isDetail ? path.slice("/notices/".length) : "";
  if (!Object.hasOwn(routes, path) && !isDetail) return notFound();
  const c = await load();
  const selected = isDetail
    ? c.noticePosts.find(post => post.id === id && post.published)
    : undefined;
  if (isDetail && !selected) return notFound();
  const defaultMeta = routes[path] ?? {
    title: `${selected!.title} · 공지사항 | ${c.brand}`,
    description: plain(selected!.body),
  };
  const title = path === "/" ? c.seoTitle : defaultMeta.title;
  const description = path === "/" ? c.seoDescription : defaultMeta.description;
  let html: string;
  try {
    const fs = await import("node:fs/promises");
    html = await fs.readFile("dist/index.html", "utf8");
  } catch {
    return new Response("사이트 빌드 문서를 찾을 수 없습니다.", {
      status: 503,
    });
  }
  const siteUrl = process.env.PUBLIC_SITE_URL || process.env.URL;
  const canonical = siteUrl ? new URL(path, siteUrl).href : "";
  const socialImage = siteUrl
    ? new URL("/images/interior.webp", siteUrl).href
    : "/images/interior.webp";
  const robots = path === "/admin" ? "noindex,nofollow" : "index,follow";
  const verification = path === "/"
    ? [
        ["google-site-verification", process.env.GOOGLE_SITE_VERIFICATION],
        ["naver-site-verification", process.env.NAVER_SITE_VERIFICATION],
      ]
        .filter(([, value]) => value?.trim())
        .map(([name, value]) => `<meta name="${name}" content="${esc(value!.trim())}">`)
        .join("")
    : "";
  const structuredData = path === "/" && canonical
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "DryCleaningOrLaundry",
        name: c.brand,
        url: canonical,
        image: socialImage,
        description,
        address: {
          "@type": "PostalAddress",
          streetAddress: c.address,
          addressCountry: "KR",
        },
        telephone: c.phones[0],
      }).replace(/</g, "\\u003c")
    : "";
  const head = `<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><meta property="og:type" content="website"><meta property="og:site_name" content="${esc(c.brand)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${esc(socialImage)}"><meta property="og:image:alt" content="세탁베스트드라이 제주 외도동 매장"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">${verification}`;
  html = html.replace(/<meta\s+name="description"[^>]*>/, "");
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => head);
  if (canonical)
    html = html.replace(
      "</head>",
      () => `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}</head>`
    );
  const published = c.noticePosts
    .filter(post => post.published)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.createdAt.localeCompare(a.createdAt)
    );
  const postList = published
    .map(
      post =>
        `<article><h2><a href="/notices/${encodeURIComponent(post.id)}">${esc(post.title)}</a></h2><p>${esc(plain(post.body))}</p><time datetime="${esc(post.createdAt)}">${esc(post.createdAt.slice(0, 10))}</time></article>`
    )
    .join("");
  const extra =
    path === "/notices"
      ? `<h2>공지사항</h2>${postList || "<p>현재 등록된 공지사항이 없습니다.</p>"}`
      : selected
        ? `<article><h2>${esc(selected.title)}</h2><p>${esc(selected.body)}</p><time datetime="${esc(selected.createdAt)}">${esc(selected.createdAt.slice(0, 10))}</time></article>`
        : path === "/"
          ? `<h2>공지사항</h2>${published
              .slice(0, 3)
              .map(
                post =>
                  `<p><a href="/notices/${encodeURIComponent(post.id)}">${esc(post.title)} — ${esc(plain(post.body))}</a></p>`
              )
              .join("")}`
          : "";
  const navigation = Object.entries(routes)
    .filter(([href]) => href !== "/admin")
    .map(([href, meta]) =>
      `<a href="${href}">${esc(meta.title.split(" · ")[0] || "홈")}</a>`
    )
    .join(" · ");
  html = html.replace(
    'id="root"></div>',
    () =>
    `id="root"><main class="ssr-seed"><h1>${esc(c.brand)} — ${esc(title)}</h1><p>${esc(description)}</p><p>${esc(c.about)}</p><h2>매장 안내</h2><p>${esc(c.address)}</p><p>${esc(c.phones.join(" · "))}</p>${c.services
      .filter(s => s.enabled)
      .map(
        s =>
          `<p>${esc(s.title)} (${s.confirmed ? "운영 서비스로 확인" : "서비스 제공 여부 확인 필요"}) — ${esc(s.description)}</p>`
      )
      .join("")}${extra}<nav aria-label="사이트 메뉴">${navigation}</nav></main></div>`
  );
  const publicContent = { ...c, noticePosts: published };
  const seed = JSON.stringify(publicContent).replace(/</g, "\\u003c");
  html = html.replace(
    /<body([^>]*)>/,
    (_match, attributes: string) => `<body${attributes}><script type="application/json" id="site-content-seed">${seed}</script><script type="application/json" id="route-seed">${JSON.stringify(path)}</script>`
  );
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public,max-age=0,s-maxage=0,must-revalidate",
      "x-content-type-options": "nosniff",
      "x-robots-tag": robots,
    },
  });
};
export const config = {
  // Serve the homepage through this function even when dist/index.html exists.
  path: ["/", "/about", "/services", "/guide", "/location", "/contact", "/notices", "/notices/*", "/privacy", "/admin"],
};
