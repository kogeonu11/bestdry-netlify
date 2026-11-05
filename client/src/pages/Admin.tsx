import { useEffect, useState } from "react";
import { Link } from "wouter";
import { defaultContent, type SiteContent } from "@shared/content";
import NoticeEditor from "@/components/NoticeEditor";
import {
  ArrowLeft,
  LockKeyhole,
  LogOut,
  Save,
  ShieldCheck,
} from "lucide-react";

function adminApi(path: string, init?: RequestInit) {
  return fetch(`/api/admin/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}
const groups: [string, (keyof SiteContent)[]][] = [
  [
    "브랜드 · 홈",
    [
      "brand",
      "heroTitle",
      "heroSub",
      "introLead",
      "introBody",
      "about",
      "mission",
      "heroImage",
      "footerNote",
      "seoTitle",
      "seoDescription",
    ],
  ],
  [
    "매장 · 연락처",
    [
      "area",
      "address",
      "phones",
      "hours",
      "breakTime",
      "representative",
      "businessNumber",
      "kakaoUrl",
      "naverMapUrl",
      "kakaoMapUrl",
    ],
  ],
  ["서비스 · 안내 · FAQ", ["services", "steps", "faqs"]],
];
const textKeys = new Set<keyof SiteContent>([
  "brand",
  "heroTitle",
  "heroSub",
  "introLead",
  "introBody",
  "about",
  "mission",
  "heroImage",
  "footerNote",
  "seoTitle",
  "seoDescription",
  "area",
  "address",
  "breakTime",
  "representative",
  "businessNumber",
  "kakaoUrl",
  "naverMapUrl",
  "kakaoMapUrl",
]);
function showValue(v: unknown) {
  return typeof v === "string" ? v : JSON.stringify(v, null, 2);
}
export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [tab, setTab] = useState(groups[0][0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [jsonErrors, setJsonErrors] = useState<
    Partial<Record<keyof SiteContent, string>>
  >({});
  useEffect(() => {
    adminApi("session")
      .then(r => {
        if (r.ok) {
          setAuthenticated(true);
          return adminApi("content").then(async x => {
            if (x.ok) setContent(await x.json());
          });
        }
      })
      .catch(() => {});
  }, []);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = await adminApi("login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "로그인할 수 없습니다.");
      setAuthenticated(true);
      setPassword("");
      const c = await adminApi("content");
      if (c.ok) setContent(await c.json());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (Object.keys(jsonErrors).length) {
      setMessage(
        "JSON 입력에 오류가 있습니다. 빨간 안내가 표시된 내용을 먼저 수정해 주세요."
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const r = await adminApi("content", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "저장에 실패했습니다.");
      setContent(d.content);
      setMessage("변경 내용이 안전하게 저장되었습니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장할 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await adminApi("logout", { method: "POST" });
    setAuthenticated(false);
  }
  function update(key: keyof SiteContent, raw: string) {
    if (!textKeys.has(key)) {
      try {
        const value = JSON.parse(raw);
        setJsonErrors(old => {
          const next = { ...old };
          delete next[key];
          return next;
        });
        setContent(prev => ({ ...prev, [key]: value }));
      } catch {
        setJsonErrors(old => ({
          ...old,
          [key]: "JSON 문법을 확인해 주세요. 이 입력은 저장되지 않습니다.",
        }));
      }
    } else {
      setContent(prev => ({ ...prev, [key]: raw }));
    }
  }
  const labels: Partial<Record<keyof SiteContent, string>> = {
    brand: "업체명",
    heroTitle: "첫 화면 메인 문구",
    heroSub: "첫 화면 설명",
    introLead: "소개 제목",
    introBody: "소개 문구 2",
    about: "업체 상세 소개",
    mission: "브랜드 메시지",
    heroImage: "메인 이미지 경로",
    footerNote: "푸터 문구",
    seoTitle: "검색 제목",
    seoDescription: "검색 설명",
    area: "매장 지역",
    address: "매장 주소",
    phones: "전화번호 목록",
    hours: "운영 요일·시간 목록",
    breakTime: "점심시간",
    representative: "대표자",
    businessNumber: "사업자등록번호",
    kakaoUrl: "카카오 상담 URL",
    naverMapUrl: "네이버 지도 URL",
    kakaoMapUrl: "카카오맵 URL",
    services: "서비스 목록 JSON",
    steps: "세탁 단계 JSON",
    faqs: "자주 묻는 질문 JSON",
  };
  return (
    <main className="admin-shell">
      <header className="admin-top">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> 홈페이지로
        </Link>
        <a className="mini-brand" href="/">
          <img src="/brand/logo.svg" alt="세탁베스트드라이" />
        </a>
        <span className="admin-kicker">SITE MANAGEMENT</span>
      </header>
      {!authenticated ? (
        <form className="login-card" onSubmit={login}>
          <span className="login-symbol">
            <LockKeyhole />
          </span>
          <p className="eyebrow">BEST DRY · PRIVATE ACCESS</p>
          <h1>관리자 로그인</h1>
          <p>브랜드와 매장 안내 정보를 안전하게 관리합니다.</p>
          <label className="field-label" htmlFor="admin-password">
            관리자 비밀번호
          </label>
          <input
            autoComplete="current-password"
            type="password"
            id="admin-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            maxLength={512}
            placeholder="비밀번호 입력"
          />
          <button disabled={busy} className="primary-button login-button">
            {busy ? "확인 중…" : "안전하게 로그인"}
          </button>
          {message && (
            <p className="form-alert" role="alert">
              {message}
            </p>
          )}
          <p className="security-caption">
            <ShieldCheck size={15} /> Netlify 환경변수로 보호되는 관리자
            화면입니다.
          </p>
        </form>
      ) : (
        <section className="admin-workspace">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">CONTENT STUDIO</p>
              <h1>매장 정보 관리</h1>
              <p>변경 내용을 수정한 후 저장해 주세요.</p>
            </div>
            <button className="logout-button" onClick={logout}>
              <LogOut size={15} /> 로그아웃
            </button>
          </div>
          <div className="admin-warning">
            <ShieldCheck size={18} />
            <span>
              전화번호와 운영 시간은 확인된 정보를 기준으로 게시됩니다. 저장
              즉시 홈페이지에 반영됩니다.
            </span>
          </div>
          <nav className="admin-tabs" aria-label="편집 항목">
            {groups.map(([title]) => (
              <button
                onClick={() => setTab(title)}
                className={tab === title ? "selected" : ""}
                key={title}
              >
                {title}
              </button>
            ))}
            <button
              onClick={() => setTab("공지사항")}
              className={tab === "공지사항" ? "selected" : ""}
            >
              공지사항
            </button>
          </nav>
          <div
            className="admin-fields"
            style={{ display: tab === "공지사항" ? "none" : undefined }}
          >
            {groups
              .find(([title]) => title === tab)?.[1]
              .map(key => {
                const isText = textKeys.has(key);
                const value = showValue(content[key]);
                const complex = !isText;
                return (
                  <label
                    className={`admin-field${complex ? " field-full" : ""}`}
                    key={key}
                  >
                    <span className="field-label">{labels[key]}</span>
                    {complex ? (
                      <>
                        <textarea
                          rows={
                            key === "services" ? 20 : key === "steps" ? 13 : 11
                          }
                          spellCheck="false"
                          value={value}
                          onChange={e => update(key, e.target.value)}
                          aria-label={labels[key]}
                        />
                        {jsonErrors[key] && (
                          <small className="form-alert" role="alert">
                            {jsonErrors[key]}
                          </small>
                        )}
                        <small>
                          JSON 배열을 편집합니다. 문법에 오류가 있는 동안에는
                          저장이 차단됩니다.
                        </small>
                      </>
                    ) : key === "about" ||
                      key === "introBody" ||
                      key === "seoDescription" ||
                      key === "mission" ? (
                      <textarea
                        rows={key === "about" ? 5 : 3}
                        value={value}
                        onChange={e => update(key, e.target.value)}
                      />
                    ) : (
                      <input
                        value={value}
                        onChange={e => update(key, e.target.value)}
                        maxLength={key === "seoTitle" ? 100 : 500}
                        placeholder={
                          key === "kakaoUrl"
                            ? "공식 카카오 채널 주소가 없으면 비워 두세요"
                            : ""
                        }
                      />
                    )}
                  </label>
                );
              })}
          </div>
          {tab === "공지사항" && (
            <NoticeEditor
              posts={content.noticePosts}
              onChange={noticePosts =>
                setContent(prev => ({ ...prev, noticePosts }))
              }
            />
          )}
          <div className="admin-save-bar">
            <span aria-live="polite">{message}</span>
            <button
              className="primary-button"
              onClick={save}
              disabled={busy || Object.keys(jsonErrors).length > 0}
            >
              <Save size={16} />
              {busy ? "저장 중…" : "변경 내용 저장"}
            </button>
          </div>
        </section>
      )}
      <footer className="admin-footer">
        세탁베스트드라이 <span>·</span> PRIVATE MANAGEMENT{" "}
        <Link href="/privacy">개인정보 처리방침</Link>
      </footer>
    </main>
  );
}
