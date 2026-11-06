import { useEffect, useRef } from "react";

/**
 * 구글 애드센스 광고 자리.
 * Netlify 환경 변수(빌드 시 적용)에 아래 값을 넣으면 광고가 표시됩니다.
 *   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 *   VITE_ADSENSE_SLOT_TOP=광고 단위 ID(상단)
 *   VITE_ADSENSE_SLOT_BOTTOM=광고 단위 ID(하단)
 * 값이 없으면 운영 사이트에는 아무것도 표시하지 않고, 개발 화면에서만 점선 자리표시가 보입니다.
 */
const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
const slots = {
  top: import.meta.env.VITE_ADSENSE_SLOT_TOP as string | undefined,
  bottom: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM as string | undefined,
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;
function loadScript(id: string) {
  if (scriptRequested || typeof document === "undefined") return;
  scriptRequested = true;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function AdSlot({ position }: { position: "top" | "bottom" }) {
  const slot = slots[position];
  const ref = useRef<HTMLModElement>(null);
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled || !client) return;
    loadScript(client);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 광고 차단 등으로 실패해도 화면에는 영향 없음 */
    }
  }, [enabled]);

  if (!enabled) {
    if (!import.meta.env.DEV) return null;
    return (
      <div className="ad-slot ad-placeholder" aria-hidden="true">
        광고 영역 ({position === "top" ? "상단" : "하단"})
      </div>
    );
  }
  return (
    <aside className="ad-slot" aria-label="광고">
      <span className="ad-label">광고</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
