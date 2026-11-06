import { AdSlot } from "@/components/AdSlot";
import { CustomerInquiries } from "@/components/Inquiries";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Menu,
  MapPin,
  Minus,
  Phone,
  Plus,
  X,
} from "lucide-react";
import { defaultContent, type SiteContent } from "@shared/content";
import {
  NoticeDetail,
  NoticeIndex,
  NoticePreview,
} from "@/components/NoticeBoard";

const routes: [string, string, string][] = [
  ["/about", "ABOUT", "소개"],
  ["/services", "SERVICES", "서비스"],
  ["/guide", "PROCESS", "이용 안내"],
  ["/location", "LOCATION", "매장 안내"],
  ["/contact", "CONTACT", "문의"],
  ["/notices", "NOTICE", "공지사항"],
];
const metas: Record<string, [string, string]> = {
  "/about": [
    "ABOUT US · 세탁베스트드라이",
    "제주 제주시 외도동 세탁베스트드라이. 소중한 옷을 정성껏 관리하는 우리 동네 세탁소를 소개합니다.",
  ],
  "/services": [
    "세탁 서비스 · 세탁베스트드라이",
    "외도동 세탁베스트드라이의 의류·침구 세탁 및 의류별 서비스 안내.",
  ],
  "/guide": [
    "세탁 이용 안내 · 세탁베스트드라이",
    "세탁물 접수부터 상태 확인과 수령까지, 세탁 이용 방법을 알아보세요.",
  ],
  "/location": [
    "매장 안내 · 세탁베스트드라이",
    "제주시 우정로 13길 10, 세탁베스트드라이. 매장 위치와 전화, 운영시간을 안내합니다.",
  ],
  "/contact": [
    "고객 문의 · 세탁베스트드라이",
    "세탁 서비스 전화 문의와 매장 방문 안내, 자주 묻는 질문을 확인하세요.",
  ],
  "/notices": [
    "공지사항 · 세탁베스트드라이",
    "세탁베스트드라이에서 전하는 매장 안내와 공지사항을 확인하세요.",
  ],
  "/privacy": [
    "개인정보 처리방침 · 세탁베스트드라이",
    "세탁베스트드라이 홈페이지의 개인정보 처리방침입니다.",
  ],
  "/admin": ["관리자 · 세탁베스트드라이", "세탁베스트드라이 홈페이지 관리자."],
};
function useContent() {
  const [data, setData] = useState<SiteContent>(() => {
    try {
      const x = document.getElementById("site-content-seed");
      return x?.textContent
        ? { ...defaultContent, ...JSON.parse(x.textContent) }
        : defaultContent;
    } catch {
      return defaultContent;
    }
  });
  useEffect(() => {
    fetch("/api/site-content", { credentials: "same-origin" })
      .then(r => (r.ok ? r.json() : null))
      .then(v => {
        if (v) setData({ ...defaultContent, ...v });
      })
      .catch(() => {});
  }, []);
  return data;
}
function useSEO(path: string, c: SiteContent) {
  const selectedNotice = path.startsWith("/notices/")
    ? c.noticePosts.find(item => {
        try {
          return (
            item.id === decodeURIComponent(path.slice("/notices/".length)) &&
            item.published
          );
        } catch {
          return false;
        }
      })
    : undefined;
  useEffect(() => {
    const [m, d] = selectedNotice
      ? [
          `${selectedNotice.title} · 공지사항 | ${c.brand}`,
          selectedNotice.body.replace(/\s+/g, " ").slice(0, 160),
        ]
      : path === "/"
        ? [c.seoTitle, c.seoDescription]
        : (metas[path] ?? [c.seoTitle, c.seoDescription]);
    document.title = m;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", d);
  }, [path, c.seoTitle, c.seoDescription, c.brand, selectedNotice]);
}
function PhoneLink({
  c,
  children,
  className = "",
}: {
  c: SiteContent;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={`tel:${c.phones[0]?.replace(/[^0-9+]/g, "") || ""}`}
    >
      <Phone size={16} />
      {children || c.phones[0]}
    </a>
  );
}
function Header({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [path] = useLocation();
  return (
    <>
      <header className={`site-header${dark ? " header-dark" : ""}`}>
        <Link className="brand-link" href="/" aria-label="세탁베스트드라이 홈">
          <img src="/brand/logo.svg" alt="세탁베스트드라이" />
        </Link>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {routes.map(([href, key, label]) => (
            <Link
              href={href}
              className={
                path === href ||
                (href === "/notices" && path.startsWith("/notices/"))
                  ? "active"
                  : ""
              }
              key={key}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/location" className="header-location">
          매장 안내 <ArrowUpRight size={14} />
        </Link>
        <button
          className="mobile-toggle"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="모바일 메뉴">
          {routes.map(([href, key, label]) => (
            <Link key={key} href={href} onClick={() => setOpen(false)}>
              <span>{key}</span>
              {label}
              <ArrowUpRight size={17} />
            </Link>
          ))}
          <p>제주시 우정로 13길 10 · 외도동</p>
        </nav>
      )}
    </>
  );
}
function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`eyebrow${light ? " eyebrow-light" : ""}`}>
      <span className="eyebrow-mark" />
      {children}
    </div>
  );
}
function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="section-intro">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
function Footer({ c }: { c: SiteContent }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href="/">
            <img src="/brand/logo.svg" alt="세탁베스트드라이" />
          </Link>
          <p>{c.footerNote}</p>
          <span className="footer-local">JEJU · OEDO-DONG</span>
        </div>
        <div className="footer-menu">
          <p className="eyebrow">EXPLORE</p>
          {routes.map(([href, key, label]) => (
            <Link href={href} key={key}>
              {label}
            </Link>
          ))}
        </div>
        <div className="footer-address">
          <p className="eyebrow">COME BY</p>
          <address>
            {c.address}
            <br />
            {c.area}
          </address>
          {c.phones.map(n => (
            <a key={n} href={`tel:${n.replace(/[^0-9+]/g, "")}`}>
              {n}
            </a>
          ))}
          <small>
            {c.hours.map(x => `${x.label} ${x.time}`).join(" · ")}
            <br />
            점심시간 {c.breakTime}
          </small>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {c.brand}. All rights reserved.
        </span>
        <div>
          <span>대표 {c.representative}</span>
          <span>사업자등록번호 {c.businessNumber}</span>
          <Link href="/privacy">개인정보 처리방침</Link>
        </div>
      </div>
      <div className="footer-admin">
        <Link className="footer-admin-link" href="/admin">
          관리자 로그인
        </Link>
      </div>
    </footer>
  );
}
function FixedContact({ c }: { c: SiteContent }) {
  return (
    <a
      className="floating-call"
      href={`tel:${c.phones[0]?.replace(/[^0-9+]/g, "") || ""}`}
      aria-label={`전화 문의 ${c.phones[0] || "매장 전화 미등록"}`}
    >
      <Phone size={18} />
      <span>전화 문의</span>
    </a>
  );
}
function ServicesGrid({ c, limit }: { c: SiteContent; limit?: number }) {
  return (
    <div className="service-grid">
      {c.services
        .filter(x => x.enabled)
        .slice(0, limit)
        .map((item, i) => (
          <article className="service-card" key={item.title}>
            <div className="service-photo">
              <img src={item.image} alt={item.title} loading="lazy" />
              <span>0{i + 1}</span>
              <a
                href={`tel:${c.phones[0]?.replace(/[^0-9+]/g, "") || ""}`}
                className="photo-arrow"
                aria-label={`${item.title} 문의`}
              >
                <ArrowUpRight />
              </a>
            </div>
            <div className="service-copy">
              <span className="service-eyebrow">{item.eyebrow}</span>
              <span
                className={`service-status${item.confirmed ? " confirmed" : ""}`}
              >
                {item.confirmed
                  ? "운영 서비스로 확인"
                  : "서비스 제공 여부 확인 필요"}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="service-note">{item.serviceNote}</span>
              <a
                className="service-ask"
                href={`tel:${c.phones[0]?.replace(/[^0-9+]/g, "") || ""}`}
              >
                전화로 가능 여부 문의 <ArrowRight size={15} />
              </a>
            </div>
          </article>
        ))}
    </div>
  );
}
function Steps({ c }: { c: SiteContent }) {
  return (
    <div className="steps-list">
      {c.steps.map((s, i) => (
        <article className="step-row" key={s.number}>
          <div className="step-number">STEP {s.number}</div>
          <div className="step-content">
            <h3>{s.title}</h3>
            <p>{s.description}</p>
          </div>
          <span className="step-icon">
            {i === c.steps.length - 1 ? (
              <Check size={17} />
            ) : (
              <ArrowDownRight size={18} />
            )}
          </span>
        </article>
      ))}
    </div>
  );
}
function VisitStrip({ c }: { c: SiteContent }) {
  return (
    <section className="visit-strip">
      <div>
        <Eyebrow>VISIT OUR STORE</Eyebrow>
        <h2>
          오늘 입은 옷처럼,
          <br />
          편안한 동네 세탁소.
        </h2>
        <p>
          {c.address}
          <br />
          {c.area}
        </p>
      </div>
      <div className="visit-actions">
        <a href={c.naverMapUrl} className="dark-button" target="_blank" rel="noreferrer">
          매장 위치 확인하기 <ArrowUpRight size={16} />
        </a>
        <PhoneLink c={c} className="text-phone">
          {c.phones[0]}
        </PhoneLink>
        <span>정확한 세탁 비용과 완료 일정은 전화로 문의해 주세요.</span>
      </div>
    </section>
  );
}
function HomePage({ c }: { c: SiteContent }) {
  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src={c.heroImage}
          alt="제주 외도동 세탁베스트드라이 매장"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="hero-meta">
          <span>JEJU · OEDO-DONG</span>
          <span>CARE, DOWN TO THE LAST THREAD.</span>
        </div>
        <div className="hero-center">
          <div className="hero-logomark">
            <img src="/favicon.svg" alt="" />
          </div>
          <Eyebrow light>BEST DRY · EST. JEJU</Eyebrow>
          <h1>
            세탁의 기준을
            <br />
            <span>더 깨끗하게.</span>
          </h1>
          <p className="hero-brand">세탁베스트드라이</p>
          <p className="hero-description">{c.heroSub}</p>
          <div className="hero-actions">
            <Link className="hero-button hero-button-light" href="/services">
              세탁 서비스 알아보기 <ArrowDownRight size={17} />
            </Link>
            <a className="hero-button hero-button-outline" href={c.naverMapUrl} target="_blank" rel="noreferrer">
              매장 위치 확인하기 <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <a className="hero-scroll" href="#story">
          <span>SCROLL TO DISCOVER</span>
          <ArrowDown size={15} />
        </a>
        <span className="hero-coordinate">33°29′N&nbsp;&nbsp;126°27′E</span>
      </section>
      <section className="story-section" id="story">
        <div className="story-side">
          <Eyebrow>OUR PROMISE · 01</Eyebrow>
          <p>
            단골의 마음으로,
            <br />한 벌의 옷까지.
          </p>
          <span>BEST DRY, JEJU</span>
        </div>
        <div className="story-copy">
          <p className="story-lead">{c.introLead}</p>
          <p className="story-sublead">{c.introBody}</p>
          <Link className="underlined-link" href="/about">
            우리의 이야기 <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="story-decoration">
          B<span>D</span>.
        </div>
      </section>
      <section className="home-services">
        <div className="services-top">
          <SectionIntro
            eyebrow="THOUGHTFUL GARMENT CARE"
            title={"옷감마다 다른,\n정성의 방법."}
            body="매일 입는 옷부터 특별한 날의 의류까지. 세탁물의 상태와 소재를 확인한 뒤 가능한 관리 방법을 안내해 드립니다."
          />
          <Link className="underlined-link all-services" href="/services">
            서비스 모두 보기 <ArrowUpRight size={15} />
          </Link>
        </div>
        <ServicesGrid c={c} limit={3} />
      </section>
      <section className="process-section">
        <div className="process-heading">
          <Eyebrow>FROM COUNTER TO CARE</Eyebrow>
          <h2>
            맡기는 순간부터,
            <br />
            <span>꼼꼼하게.</span>
          </h2>
          <p>
            세탁에 필요한 절차와 수령 일정을
            <br />
            매장 접수 시 확인해 주세요.
          </p>
          <Link className="underlined-link" href="/guide">
            이용 안내 자세히 보기 <ArrowUpRight size={15} />
          </Link>
        </div>
        <Steps c={{ ...c, steps: c.steps.slice(0, 4) }} />
      </section>
      <section className="showcase-band">
        <img
          src="/images/storefront.webp"
          alt="세탁베스트드라이 매장과 주변 거리"
          loading="lazy"
        />
        <div className="showcase-copy">
          <Eyebrow light>YOUR NEIGHBORHOOD CLEANERS</Eyebrow>
          <h2>
            좋은 옷을,
            <br />더 오래 곁에.
          </h2>
          <p>
            제주 외도동에서 변함없이
            <br />한 벌, 한 벌 정성을 담습니다.
          </p>
          <Link className="light-line-link" href="/about">
            세탁베스트드라이 소개 <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <NoticePreview posts={c.noticePosts} />
      <VisitStrip c={c} />
    </>
  );
}
function InnerHeader({
  eyebrow,
  title,
  body,
  image,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
}) {
  return (
    <section className="inner-hero">
      <img src={image} alt="" />
      <div className="inner-hero-shade" />
      <div className="inner-hero-copy">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      <span className="inner-index">BEST DRY · JEJU</span>
    </section>
  );
}
function AboutPage({ c }: { c: SiteContent }) {
  return (
    <>
      <InnerHeader
        eyebrow="A NOTE FROM OUR SHOP"
        title={"ABOUT\nOUR CARE."}
        body="소중한 한 벌을 오래 입는 일. 그 마음을 생각하며 세탁합니다."
        image="/images/storefront.webp"
      />
      <section className="about-feature">
        <div className="about-feature-image">
          <img
            src="/images/interior.webp"
            alt="세탁베스트드라이 매장 내부"
            loading="lazy"
          />
          <span className="image-caption">OUR EVERYDAY, IN OEDO-DONG</span>
        </div>
        <div className="about-feature-copy">
          <Eyebrow>ABOUT US</Eyebrow>
          <h2>{c.introLead}</h2>
          <p>{c.introBody}</p>
          <p>{c.about}</p>
          <div className="about-mark">
            {c.mission.split("\n").map(x => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </section>
      <div className="quote-line">
        <Eyebrow>THE BEST WAY TO CARE</Eyebrow>
        <p>“{c.footerNote}”</p>
        <span>제주 외도동, 세탁베스트드라이</span>
      </div>
      <VisitStrip c={c} />
    </>
  );
}
function ServicesPage({ c }: { c: SiteContent }) {
  return (
    <>
      <InnerHeader
        eyebrow="A BETTER WAY TO CARE"
        title={"SERVICES,\nWITH CARE."}
        body="모든 옷에는 알맞은 관리법이 있습니다. 품목별 세탁 가능 여부를 먼저 확인해 드립니다."
        image="/images/workroom.webp"
      />
      <section className="inner-body services-page">
        <div className="services-page-note">
          <Eyebrow>OUR SERVICES</Eyebrow>
          <p>
            아래 서비스는 접수 안내를 위한 항목입니다. 원단과 상태에 따라 제공
            여부가 달라질 수 있으니 전화로 먼저 문의해 주세요.
          </p>
        </div>
        <ServicesGrid c={c} />
      </section>
      <VisitStrip c={c} />
    </>
  );
}
function GuidePage({ c }: { c: SiteContent }) {
  return (
    <>
      <InnerHeader
        eyebrow="FROM INTAKE TO COLLECTION"
        title={"A LITTLE MORE\nTHOUGHTFUL."}
        body="세탁물을 맡기기 전에 확인하면 좋은 이용 과정."
        image="/images/delivery.webp"
      />
      <section className="inner-body guide-page">
        <div className="guide-heading">
          <Eyebrow>FIVE THOUGHTFUL STEPS</Eyebrow>
          <h2>
            안심하고 맡기실 수 있도록,
            <br />
            과정을 안내해 드립니다.
          </h2>
          <p>
            세탁 기간과 수령 일정, 비용은 품목의 소재 및 상태에 따라 달라집니다.
            <br />
            세부 사항은 접수할 때 매장에 확인해 주세요.
          </p>
        </div>
        <Steps c={c} />
      </section>
      <VisitStrip c={c} />
    </>
  );
}
function LocationPage({ c }: { c: SiteContent }) {
  const tel = c.phones[0]?.replace(/[^0-9+]/g, "");
  return (
    <>
      <InnerHeader
        eyebrow="FIND OUR STORE IN JEJU"
        title={"A NEIGHBORHOOD\nPLACE, FOR YOU."}
        body="제주 제주시 외도동, 세탁베스트드라이."
        image="/images/sign-day.webp"
      />
      <section className="inner-body location-page">
        <div className="location-copy">
          <Eyebrow>FIND US · 제주 제주시 외도동</Eyebrow>
          <h2>
            가까운 곳에서,
            <br />
            반갑게 맞이할게요.
          </h2>
          <address>
            {c.address}
            <br />
            {c.area}
          </address>
          <div className="location-links">
            <a href={c.naverMapUrl} target="_blank" rel="noreferrer">
              네이버지도에서 위치 확인 <ArrowUpRight size={15} />
            </a>
            <a href={c.kakaoMapUrl} target="_blank" rel="noreferrer">
              카카오맵에서 보기 <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div className="store-details">
          <div className="detail-heading">
            <MapPin />
            <span>STORE INFORMATION</span>
          </div>
          <dl>
            <dt>주소</dt>
            <dd>{c.address}</dd>
            <dt>전화</dt>
            <dd>
              {c.phones.map((n, i) => (
                <a
                  className="detail-tel"
                  key={n}
                  href={`tel:${n.replace(/[^0-9+]/g, "")}`}
                >
                  {n}
                  {i === 0 && <ArrowUpRight size={12} />}
                </a>
              ))}
            </dd>
            <dt>평일</dt>
            <dd>
              {c.hours.find(x => x.label.includes("평일"))?.time ?? "전화 문의"}
            </dd>
            <dt>토·공휴일</dt>
            <dd>
              {c.hours.find(x => x.label.includes("토요일"))?.time ??
                "전화 문의"}
            </dd>
            <dt>일요일·명절</dt>
            <dd>
              {c.hours.find(x => x.label.includes("일요일"))?.time ??
                "전화 문의"}
            </dd>
            <dt>점심시간</dt>
            <dd>{c.breakTime}</dd>
          </dl>
          <p>
            품목별 세탁 가능 여부와 수령 일정을 미리 전화로 문의하시면 더
            편리합니다.
          </p>
          <a href={`tel:${tel || ""}`} className="detail-call">
            <Phone size={16} /> 매장에 전화하기 <ArrowRight size={15} />
          </a>
        </div>
      </section>
      <VisitStrip c={c} />
    </>
  );
}
function ContactPage({ c }: { c: SiteContent }) {
  return (
    <>
      <InnerHeader
        eyebrow="HERE WHEN YOU NEED US"
        title={"LET'S TALK\nABOUT YOUR CARE."}
        body="맡기시기 전, 궁금한 점을 편하게 문의해 주세요."
        image="/images/sign-night.webp"
      />
      <section className="inner-body contact-page">
        <div className="contact-intro">
          <Eyebrow>CONTACT OUR STORE</Eyebrow>
          <h2>
            옷에 대해 궁금하신 점,
            <br />
            직접 여쭤보세요.
          </h2>
          <p>
            품목별 세탁 가능 여부, 비용과 수령 일정은
            <br />
            매장에서 의류를 확인한 후 안내해 드립니다.
          </p>
          <a className="dark-button" href="#customer-inquiry">
            문의하기 <ArrowDownRight size={16} />
          </a>
        </div>
      </section>
      <AdSlot position="top" />
      <CustomerInquiries />
      <AdSlot position="bottom" />
      <section className="faq-section">
        <Eyebrow>COMMON QUESTIONS</Eyebrow>
        <h2>자주 묻는 질문.</h2>
        <div className="faq-list">
          {c.faqs.map((f, i) => (
            <details key={f.question}>
              <summary>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{f.question}</b>
                <Plus className="faq-plus" size={17} />
              </summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <VisitStrip c={c} />
    </>
  );
}
function PrivacyPage() {
  return (
    <>
      <InnerHeader
        eyebrow="POLICY · INFORMATION"
        title={"YOUR PRIVACY,\nRESPECTED."}
        body="고객의 정보를 소중히 생각합니다."
        image="/images/sign-day.webp"
      />
      <section className="inner-body policy-content">
        <Eyebrow>개인정보 처리방침</Eyebrow>
        <h2>
          개인정보를 최소한으로,
          <br />
          신중하게 보호합니다.
        </h2>
        <p>
          세탁베스트드라이(이하 “사업자”)는 고객의 개인정보를 중요하게
          생각합니다. 본 홈페이지의 공지사항은 관리자가 작성하는 열람용
          안내입니다. 문의 게시판에서는 작성자(닉네임), 제목, 내용, 글 비밀번호를 처리합니다. 게시판 글은 누구나 읽을 수 있도록 공개됩니다.
          비밀번호는 해시로 저장하여 작성자가 본인 글을 삭제할 때만 확인합니다.
          게시글에는 연락처·주소 등 개인정보를 적지 말아 주세요.
        </p>
        <h3>외부 서비스 연결</h3>
        <p>
          이 사이트는 구글 애드센스 광고를 게재할 수 있으며, 구글과 광고 파트너가 쿠키 등을 사용해 광고를 제공할 수 있습니다. 광고 개인 맞춤 설정은 구글 광고 설정에서 관리할 수 있습니다.
          전화 문의 버튼을 선택하면 고객이 사용하는 기기의 전화 애플리케이션이
          열립니다. 네이버 지도와 카카오맵은 각 서비스가 제공하는
          외부 사이트로 연결됩니다. 외부 서비스의 개인정보 처리는 해당 사업자의
          개인정보 처리방침을 따릅니다.
        </p>
        <h3>쿠키 및 이용기록</h3>
        <p>
          홈페이지의 안정적인 제공과 페이지 표시를 위해 필수 기술 정보가 처리될
          수 있습니다. 홈페이지 자체는 고객 프로필 추적을 의도적으로 설정하지
          않습니다. 다만 광고가 게재되는 경우 구글과 광고 파트너가 광고 제공·측정을
          위해 쿠키를 사용할 수 있습니다.
        </p>
        <h3>문의 및 처리방침 안내</h3>
        <p>
          본 처리방침 내용과 관련하여 문의가 있으신 경우 사업장의 전화번호로
          연락해 주세요. 게시글에 대한 정정, 삭제 요청도 매장에 문의해 주세요.
        </p>
        <p className="policy-asof">
          본 처리방침은 홈페이지 개설일에 게시되었습니다.
        </p>
      </section>
      <VisitStrip c={defaultContent} />
    </>
  );
}
function Page404({ c }: { c: SiteContent }) {
  return (
    <section className="not-found">
      <Eyebrow>NOT FOUND · 404</Eyebrow>
      <h1>
        찾으시는 페이지가
        <br />
        보이지 않네요.
      </h1>
      <p>주소를 다시 확인해 주시거나, 홈페이지로 돌아가 주세요.</p>
      <Link href="/" className="dark-button">
        홈페이지로 돌아가기 <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
export default function Home() {
  const c = useContent();
  const [path] = useLocation();
  const isAdmin = path === "/admin";
  useSEO(path, c);
  const body = useMemo(() => {
    switch (path) {
      case "/":
        return <HomePage c={c} />;
      case "/about":
        return <AboutPage c={c} />;
      case "/services":
        return <ServicesPage c={c} />;
      case "/guide":
        return <GuidePage c={c} />;
      case "/location":
        return <LocationPage c={c} />;
      case "/contact":
        return <ContactPage c={c} />;
      case "/notices":
        return <NoticeIndex c={c} />;
      case "/privacy":
        return <PrivacyPage />;
      default:
        if (path.startsWith("/notices/")) {
          let noticeId = "";
          try {
            noticeId = decodeURIComponent(path.slice("/notices/".length));
          } catch {
            return <Page404 c={c} />;
          }
          const post = c.noticePosts.find(
            item => item.id === noticeId && item.published
          );
          return post ? <NoticeDetail c={c} post={post} /> : <Page404 c={c} />;
        }
        return <Page404 c={c} />;
    }
  }, [path, c]);
  return (
    <>
      <div className="site-shell">
        <Header dark={path === "/"} />
        {body}
        {!isAdmin && <Footer c={c} />}
      </div>
      {!isAdmin && path !== "/contact" && <FixedContact c={c} />}
    </>
  );
}
