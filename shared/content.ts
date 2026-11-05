export type ServiceItem = {
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  enabled: boolean;
  confirmed: boolean;
  serviceNote: string;
};
export type StepItem = { number: string; title: string; description: string };
export type FAQItem = { question: string; answer: string };
export type NoticePost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  pinned: boolean;
  image?: string;
};
export const maxNoticeImageLength = 410_000;
export const maxNoticeImagesLength = 1_600_000;
export function publicNoticePost(post: NoticePost): NoticePost {
  return { ...post, image: post.image ? `/api/notice-image/${post.id}` : undefined };
}
export type SiteContent = {
  brand: string;
  heroTitle: string;
  heroSub: string;
  introLead: string;
  introBody: string;
  about: string;
  mission: string;
  heroImage: string;
  services: ServiceItem[];
  steps: StepItem[];
  faqs: FAQItem[];
  noticePosts: NoticePost[];
  address: string;
  area: string;
  phones: string[];
  hours: { label: string; time: string }[];
  breakTime: string;
  representative: string;
  businessNumber: string;
  kakaoUrl: string;
  naverMapUrl: string;
  kakaoMapUrl: string;
  seoTitle: string;
  seoDescription: string;
  footerNote: string;
};
export const defaultContent: SiteContent = {
  brand: "세탁베스트드라이",
  heroTitle: "세탁의 기준을\n더 깨끗하게.",
  heroSub: "제주 외도동에서 만나는 정성스러운 세탁 서비스.",
  introLead: "세탁은 단순히 옷을 깨끗하게 만드는 일이 아닙니다.",
  introBody:
    "소중한 의류를 더욱 오래, 쾌적하게 착용할 수 있도록 정성을 다하는 일입니다.",
  about:
    "세탁베스트드라이는 제주 외도동을 중심으로 고객에게 편리하고 믿을 수 있는 세탁 서비스를 제공하는 것을 목표로 합니다. 좋은 세탁소를 찾는다는 건 소중한 옷을 믿고 맡길 수 있는 이웃을 만나는 일입니다. 한 벌 한 벌 옷감의 특성과 상태를 살펴 정성껏 관리합니다.",
  mission: "좋은 옷을,\n더 오래 곁에.",
  heroImage: "/images/interior.webp",
  services: [
    {
      eyebrow: "01 / EVERYDAY",
      title: "일반 의류 세탁",
      description:
        "매일 입는 소중한 옷, 소재와 상태를 살펴 알맞은 관리 방법을 안내해 드립니다.",
      image: "/images/workroom.webp",
      enabled: true,
      confirmed: false,
      serviceNote:
        "의류 소재와 오염 상태에 따라 세탁 가능 여부를 접수 시 확인해 주세요.",
    },
    {
      eyebrow: "02 / SHIRTS & SUITS",
      title: "셔츠 및 정장 세탁",
      description:
        "실루엣과 깔끔한 인상을 생각하는 셔츠와 정장 관리. 의류 상태를 먼저 확인합니다.",
      image: "/images/interior.webp",
      enabled: true,
      confirmed: false,
      serviceNote: "원단과 세탁 라벨에 따라 작업 방법이 달라질 수 있습니다.",
    },
    {
      eyebrow: "03 / OUTERWEAR",
      title: "코트 및 외투 관리",
      description:
        "계절마다 함께하는 외투, 세탁 전에 소재와 부자재를 꼼꼼히 살펴봅니다.",
      image: "/images/delivery.webp",
      enabled: true,
      confirmed: false,
      serviceNote: "가죽·모피·특수가공 소재는 접수 전 문의해 주세요.",
    },
    {
      eyebrow: "04 / BEDDING",
      title: "이불 및 침구 세탁",
      description:
        "부피가 큰 침구류도 세탁 가능 품목과 일정부터 차분히 안내해 드립니다.",
      image: "/images/storefront.webp",
      enabled: true,
      confirmed: false,
      serviceNote: "크기와 소재에 따른 접수 가능 여부는 사전에 확인해 주세요.",
    },
    {
      eyebrow: "05 / HOME TEXTILES",
      title: "생활 섬유 세탁",
      description:
        "커튼 등 생활 섬유는 품목과 소재에 따른 작업 가능 여부를 상담해 드립니다.",
      image: "/images/sign-day.webp",
      enabled: true,
      confirmed: false,
      serviceNote: "품목별 서비스 제공 여부는 매장에 먼저 문의해 주세요.",
    },
    {
      eyebrow: "06 / SPECIAL CARE",
      title: "전문 의류 관리",
      description:
        "특별한 날의 의류나 관리가 어려운 옷은 접수 전 상담 후 이용해 주세요.",
      image: "/images/sign-night.webp",
      enabled: true,
      confirmed: false,
      serviceNote:
        "특수 얼룩, 예복, 니트 등은 현장 확인 후 서비스 여부를 안내합니다.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "매장 방문 · 접수",
      description: "세탁물과 원하시는 사항을 함께 말씀해 주세요.",
    },
    {
      number: "02",
      title: "의류 상태 확인",
      description:
        "소재와 오염, 세탁 라벨을 살펴 적합한 관리 방법을 안내합니다.",
    },
    {
      number: "03",
      title: "세탁 · 관리",
      description: "접수 시 안내한 절차에 따라 옷감을 세심하게 관리합니다.",
    },
    {
      number: "04",
      title: "마무리 검수",
      description: "작업이 끝난 세탁물을 한 번 더 확인하고 정돈합니다.",
    },
    {
      number: "05",
      title: "완료 · 수령",
      description: "세탁물 수령 일정은 접수할 때 매장에 확인해 주세요.",
    },
  ],
  faqs: [
    {
      question: "어떤 옷을 맡길 수 있나요?",
      answer:
        "일반 의류, 셔츠, 정장, 코트, 침구 및 생활 섬유 등을 안내합니다. 소재와 오염에 따라 작업 가능 여부가 달라질 수 있으니 특수 소재는 접수 전에 문의해 주세요.",
    },
    {
      question: "세탁 비용과 기간은 어떻게 되나요?",
      answer:
        "품목과 소재, 세탁 상태에 따라 달라집니다. 정확한 비용과 수령 일정은 의류를 확인한 후 매장으로 문의해 주세요.",
    },
    {
      question: "세탁물 수거 또는 배달이 가능한가요?",
      answer:
        "이 홈페이지에서 현재 수거·배달 가능 여부가 확인되지 않습니다. 필요하시면 이용 가능 지역과 조건을 매장에 직접 문의해 주세요.",
    },
    {
      question: "특수 소재나 얼룩이 있는 옷도 맡길 수 있나요?",
      answer:
        "가죽·모피·특수 가공, 오래된 얼룩 등은 원단 및 상태에 따라 관리 가능 여부가 다릅니다. 접수 전에 사진이나 의류를 보여주시면 확인을 돕습니다.",
    },
  ],
  noticePosts: [],
  address: "제주특별자치도 제주시 우정로 13길 10, 102호(1층)",
  area: "제주 제주시 외도동",
  phones: ["064-742-5484", "010-3422-8598"],
  hours: [
    { label: "평일", time: "09:00–20:00" },
    { label: "토요일 · 공휴일", time: "09:00–19:00" },
    { label: "일요일 · 명절", time: "휴무" },
  ],
  breakTime: "12:00–13:30",
  representative: "홍금실",
  businessNumber: "616-26-20761",
  kakaoUrl: "",
  naverMapUrl:
    "https://map.naver.com/p/search/%EC%A0%9C%EC%A3%BC%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84%20%EC%A0%9C%EC%A3%BC%EC%8B%9C%20%EC%9A%B0%EC%A0%95%EB%A1%9C13%EA%B8%B8%2010",
  kakaoMapUrl:
    "https://map.kakao.com/?q=%EC%A0%9C%EC%A3%BC%EC%8B%9C%20%EC%9A%B0%EC%A0%95%EB%A1%9C13%EA%B8%B8%2010",
  seoTitle: "세탁베스트드라이 | 제주 제주시 외도동 세탁소",
  seoDescription:
    "제주 제주시 외도동 세탁베스트드라이. 의류와 침구 관리, 세탁 이용 안내, 매장 위치와 운영 시간을 확인하세요.",
  footerNote: "소중한 한 벌도, 동네에서 오래 정성껏.",
};
export function sanitizeContent(input: unknown): SiteContent {
  const raw =
    input && typeof input === "object" ? (input as Partial<SiteContent>) : {};
  const text = (v: unknown, fallback: string, max = 3000) =>
    typeof v === "string" ? v.slice(0, max) : fallback;
  const validUrl = (v: unknown, fallback = "") => {
    if (typeof v !== "string" || v.length > 1200) return fallback;
    if (v.startsWith("/") && !v.startsWith("//")) return v;
    try {
      const u = new URL(v);
      return ["https:", "http:"].includes(u.protocol) ? u.toString() : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    ...defaultContent,
    ...raw,
    brand: text(raw.brand, defaultContent.brand, 80),
    heroTitle: text(raw.heroTitle, defaultContent.heroTitle, 140),
    heroSub: text(raw.heroSub, defaultContent.heroSub, 240),
    introLead: text(raw.introLead, defaultContent.introLead, 300),
    introBody: text(raw.introBody, defaultContent.introBody, 600),
    about: text(raw.about, defaultContent.about, 2200),
    mission: text(raw.mission, defaultContent.mission, 180),
    heroImage: validUrl(raw.heroImage, defaultContent.heroImage),
    services: Array.isArray(raw.services)
      ? raw.services.slice(0, 12).map((x, i) => ({
          ...defaultContent.services[i % 6],
          ...x,
          title: text(x?.title, "서비스", 100),
          eyebrow: text(x?.eyebrow, "SERVICE", 100),
          description: text(x?.description, "", 500),
          image: validUrl(x?.image, "/images/interior.webp"),
          enabled: x?.enabled !== false,
          confirmed: x?.confirmed === true,
          serviceNote: text(
            x?.serviceNote,
            "이용 가능 여부는 문의해 주세요.",
            500
          ),
        }))
      : defaultContent.services,
    steps: Array.isArray(raw.steps)
      ? raw.steps.slice(0, 10).map((x, i) => ({
          number: text(x?.number, String(i + 1).padStart(2, "0"), 8),
          title: text(x?.title, "이용 안내", 100),
          description: text(x?.description, "", 500),
        }))
      : defaultContent.steps,
    faqs: Array.isArray(raw.faqs)
      ? raw.faqs.slice(0, 20).map(x => ({
          question: text(x?.question, "문의", 200),
          answer: text(x?.answer, "전화로 문의해 주세요.", 1000),
        }))
      : defaultContent.faqs,
    noticePosts: Array.isArray(raw.noticePosts)
      ? raw.noticePosts.slice(0, 100).map((x, i) => {
          const candidate =
            typeof x?.id === "string" ? x.id : `notice-${i + 1}`;
          const safeDate = (value: unknown) => {
            if (
              typeof value !== "string" ||
              !Number.isFinite(Date.parse(value))
            )
              return "2025-01-01T00:00:00.000Z";
            return new Date(value).toISOString();
          };
          return {
            id: /^[a-zA-Z0-9_-]{1,100}$/.test(candidate)
              ? candidate
              : `notice-${i + 1}`,
            title: text(x?.title, "공지사항", 100),
            body: text(x?.body, "", 10000),
            createdAt: safeDate(x?.createdAt),
            updatedAt: safeDate(x?.updatedAt),
            published: x?.published === true,
            pinned: x?.pinned === true,
            image: typeof x?.image === "string" &&
              x.image.length <= maxNoticeImageLength &&
              /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(x.image)
                ? x.image
                : undefined,
          };
        })
      : defaultContent.noticePosts,
    address: text(raw.address, defaultContent.address, 220),
    area: text(raw.area, defaultContent.area, 100),
    phones: Array.isArray(raw.phones)
      ? raw.phones.slice(0, 3).map(x => text(x, "", 32))
      : defaultContent.phones,
    hours: Array.isArray(raw.hours)
      ? raw.hours.slice(0, 10).map(x => ({
          label: text(x?.label, "요일", 40),
          time: text(x?.time, "문의", 50),
        }))
      : defaultContent.hours,
    breakTime: text(raw.breakTime, defaultContent.breakTime, 80),
    representative: text(raw.representative, defaultContent.representative, 80),
    businessNumber: text(raw.businessNumber, defaultContent.businessNumber, 40),
    kakaoUrl: validUrl(raw.kakaoUrl),
    naverMapUrl: validUrl(raw.naverMapUrl, defaultContent.naverMapUrl),
    kakaoMapUrl: validUrl(raw.kakaoMapUrl, defaultContent.kakaoMapUrl),
    seoTitle: text(raw.seoTitle, defaultContent.seoTitle, 100),
    seoDescription: text(
      raw.seoDescription,
      defaultContent.seoDescription,
      200
    ),
    footerNote: text(raw.footerNote, defaultContent.footerNote, 180),
  };
}
