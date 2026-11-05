import { ArrowLeft, ArrowUpRight, Bell } from "lucide-react";
import { Link } from "wouter";
import type { NoticePost, SiteContent } from "@shared/content";

export function publicNotices(posts: NoticePost[]) {
  return [...posts]
    .filter(post => post.published)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.createdAt.localeCompare(a.createdAt)
    );
}

function formattedDate(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Date(time).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
}

function excerpt(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 145 ? `${text.slice(0, 145)}…` : text;
}

export function NoticePreview({ posts }: { posts: NoticePost[] }) {
  const latest = publicNotices(posts).slice(0, 3);
  return (
    <section className="notice-preview">
      <div className="notice-preview-heading">
        <div>
          <span className="notice-kicker">
            <Bell size={14} /> NOTICE
          </span>
          <h2>매장의 새로운 소식.</h2>
        </div>
        <Link className="underlined-link" href="/notices">
          공지사항 모두 보기 <ArrowUpRight size={15} />
        </Link>
      </div>
      {latest.length ? (
        <div className="notice-preview-list">
          {latest.map(post => (
            <Link
              className="notice-preview-row"
              key={post.id}
              href={`/notices/${encodeURIComponent(post.id)}`}
            >
              <time>{formattedDate(post.createdAt)}</time>
              <span>{post.pinned && <b>중요</b>}</span>
              <strong>{post.title}</strong>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="notice-preview-empty">현재 등록된 공지사항이 없습니다.</p>
      )}
    </section>
  );
}

export function NoticeIndex({ c }: { c: SiteContent }) {
  const list = publicNotices(c.noticePosts);
  return (
    <>
      <section className="notice-page-heading">
        <span className="notice-kicker">
          <Bell size={14} /> BEST DRY · STORE UPDATES
        </span>
        <h1>매장의 소식과 안내.</h1>
        <p>세탁베스트드라이에서 전하는 공지사항을 확인해 주세요.</p>
      </section>
      <main className="notice-page-list">
        <div className="notice-list-head">
          <Eyebrow>NOTICE ARCHIVE</Eyebrow>
          <span>{list.length}건</span>
        </div>
        {list.length ? (
          <div className="notice-archive-list">
            {list.map(post => (
              <Link
                className="notice-archive-row"
                key={post.id}
                href={`/notices/${encodeURIComponent(post.id)}`}
              >
                <span className="notice-archive-date">
                  {formattedDate(post.createdAt)}
                </span>
                <span className="notice-archive-title">
                  {post.pinned && <b>중요</b>}
                  <strong>{post.title}</strong>
                  <small>{excerpt(post.body)}</small>
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="notice-empty">현재 등록된 공지사항이 없습니다.</p>
        )}
      </main>
    </>
  );
}

export function NoticeDetail({
  c,
  post,
}: {
  c: SiteContent;
  post: NoticePost | undefined;
}) {
  if (!post || !post.published) {
    return (
      <section className="not-found">
        <Eyebrow>NOTICE · 404</Eyebrow>
        <h1>공지사항을 찾을 수 없습니다.</h1>
        <p>공개 중인 공지인지 확인한 뒤 다시 방문해 주세요.</p>
        <Link href="/notices" className="dark-button">
          공지사항 목록 <ArrowLeft size={16} />
        </Link>
      </section>
    );
  }
  return (
    <>
      <section className="notice-detail-heading">
        <span className="notice-kicker">
          <Bell size={14} /> STORE NOTICE · {c.brand}
        </span>
        <h1>{post.title}</h1>
        <time>{formattedDate(post.createdAt)}</time>
      </section>
      <article className="notice-detail-copy">
        <div className="notice-content-text">{post.body}</div>
        <Link className="underlined-link" href="/notices">
          <ArrowLeft size={15} /> 공지사항 목록으로
        </Link>
      </article>
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="notice-eyebrow">
      <span />
      {children}
    </span>
  );
}
