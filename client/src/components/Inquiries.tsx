import { useEffect, useState, type FormEvent } from "react";

type Inquiry = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
};
type InquiryRow = Pick<Inquiry, "id" | "title" | "createdAt"> & {
  answered: boolean;
};
const adminPath = "/api/admin/inquiries";

async function api<T>(path: string, method = "GET", body?: object): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    ...(body && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "요청을 처리하지 못했습니다.");
  return data as T;
}

const date = (value: string) => new Date(value).toLocaleDateString("ko-KR");
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";

export function CustomerInquiries() {
  const [lookup, setLookup] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [inquiry, setInquiry] = useState<Inquiry>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setInquiry(undefined);
    setMessage("");
    try {
      if (lookup) {
        setInquiry(await api<Inquiry>("/api/inquiries/lookup", "POST", values));
        const password = form.elements.namedItem(
          "password",
        ) as HTMLInputElement;
        password.value = "";
      } else {
        const result = await api<{ id: string }>(
          "/api/inquiries",
          "POST",
          values,
        );
        setReceipt(result.id);
        form.reset();
      }
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="customer-inquiry"
      className="inner-body inquiry-section"
      aria-labelledby="inquiry-title"
    >
      <h2 id="inquiry-title">온라인 문의</h2>
      <nav className="admin-tabs" aria-label="문의 메뉴">
        <button
          type="button"
          disabled={busy}
          className={!lookup ? "selected" : ""}
          onClick={() => {
            setLookup(false);
            setMessage("");
          }}
        >
          문의 작성
        </button>
        <button
          type="button"
          disabled={busy}
          className={lookup ? "selected" : ""}
          onClick={() => {
            setLookup(true);
            setMessage("");
          }}
        >
          답변 확인
        </button>
      </nav>
      {receipt && (
        <div className="inquiry-record" role="status">
          <strong>문의가 접수되었습니다.</strong>
          <label>
            접수번호{" "}
            <input
              readOnly
              value={receipt}
              onFocus={(event) => event.target.select()}
            />
          </label>
          <p>
            나중에 답변을 확인하려면 접수번호와 작성할 때 정한 비밀번호를
            보관하세요.
          </p>
        </div>
      )}
      <form className="notice-compose" onSubmit={submit} key={String(lookup)}>
        {lookup ? (
          <label>
            접수번호{" "}
            <input name="id" required maxLength={46} defaultValue={receipt} />
          </label>
        ) : (
          <>
            <label>
              문의 제목 <input name="title" required maxLength={100} />
            </label>
            <label>
              문의 내용{" "}
              <textarea name="body" required maxLength={4000} rows={6} />
            </label>
            <p>
              문의는 비공개로 접수됩니다. 주민등록번호나 카드번호 등은 입력하지
              마세요.
            </p>
          </>
        )}
        <label>
          문의 비밀번호 (8자 이상)
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete={lookup ? "current-password" : "new-password"}
          />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? "처리 중…" : lookup ? "답변 확인하기" : "문의 보내기"}
        </button>
        {message && <p role="alert">{message}</p>}
      </form>
      {lookup && inquiry && (
        <article className="inquiry-record">
          <h3>{inquiry.title}</h3>
          <p>{inquiry.body}</p>
          <strong>
            관리자 답변
            {inquiry.repliedAt ? ` · ${date(inquiry.repliedAt)}` : ""}
          </strong>
          <p>{inquiry.reply || "아직 등록된 답변이 없습니다."}</p>
        </article>
      )}
    </section>
  );
}

export function AdminInquiries() {
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inquiry>();
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(before?: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{ items: InquiryRow[]; next: string | null }>(
        before
          ? `${adminPath}?before=${encodeURIComponent(before)}`
          : adminPath,
      );
      setItems((previous) =>
        before ? [...previous, ...result.items] : result.items,
      );
      setNext(result.next);
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function open(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const inquiry = await api<Inquiry>(
        `${adminPath}?id=${encodeURIComponent(id)}`,
      );
      setSelected(inquiry);
      setReply(inquiry.reply ?? "");
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const inquiry = await api<Inquiry>(adminPath, "PUT", {
        id: selected.id,
        reply,
      });
      setSelected(inquiry);
      setItems((previous) =>
        previous.map((row) =>
          row.id === inquiry.id ? { ...row, answered: true } : row,
        ),
      );
      setMessage(
        "답변을 저장했습니다. 고객이 답변 확인 화면에서 볼 수 있습니다.",
      );
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="inquiry-section" aria-labelledby="admin-inquiry-title">
      <h2 id="admin-inquiry-title">고객 문의</h2>
      <button
        type="button"
        className="underlined-link"
        disabled={busy}
        onClick={() => void load()}
      >
        목록 새로고침
      </button>
      {items.length ? (
        <ul className="inquiry-list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="underlined-link"
                disabled={busy}
                onClick={() => void open(item.id)}
              >
                {item.title} · {date(item.createdAt)} ·{" "}
                {item.answered ? "답변 완료" : "답변 대기"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !busy && !message && <p>접수된 문의가 없습니다.</p>
      )}
      {next && (
        <button
          type="button"
          className="underlined-link"
          disabled={busy}
          onClick={() => void load(next)}
        >
          이전 문의 더 보기
        </button>
      )}
      {selected && (
        <article className="inquiry-record">
          <h3>{selected.title}</h3>
          <p>{selected.body}</p>
          <form className="notice-compose" onSubmit={save}>
            <label>
              답변 내용{" "}
              <textarea
                rows={5}
                maxLength={4000}
                required
                value={reply}
                onChange={(event) => setReply(event.target.value)}
              />
            </label>
            <button className="primary-button" disabled={busy}>
              답변 저장
            </button>
          </form>
        </article>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
