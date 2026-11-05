import { useEffect, useState, type FormEvent } from "react";

type Inquiry = {
  id: string;
  title: string;
  body: string;
  author?: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
};
type InquiryRow = Pick<Inquiry, "id" | "title" | "createdAt"> & {
  author: string;
  answered: boolean;
  legacy?: boolean;
};
const adminPath = "/api/admin/inquiries";
const publicPath = "/api/inquiries";

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
  const [view, setView] = useState<"list" | "write">("list");
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inquiry>();
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [openedAt, setOpenedAt] = useState(Date.now());

  async function load(before?: string) {
    setBusy(true);
    try {
      const result = await api<{ items: InquiryRow[]; next: string | null }>(
        before
          ? `${publicPath}?before=${encodeURIComponent(before)}`
          : publicPath,
      );
      setItems(previous =>
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
    setDeletePassword("");
    try {
      setSelected(
        await api<Inquiry>(`${publicPath}?id=${encodeURIComponent(id)}`),
      );
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage("");
    try {
      await api<{ id: string }>(publicPath, "POST", {
        ...values,
        elapsed: Date.now() - openedAt,
      });
      form.reset();
      setView("list");
      setMessage("글이 등록되었습니다.");
      await load();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeOwn(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!window.confirm("이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다."))
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(publicPath, "DELETE", {
        id: selected.id,
        password: deletePassword,
      });
      setItems(previous => previous.filter(row => row.id !== selected.id));
      setSelected(undefined);
      setMessage("글을 삭제했습니다.");
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
      <h2 id="inquiry-title">문의 게시판</h2>
      <p className="inquiry-guide">
        누구나 글을 읽고 남길 수 있는 공개 게시판입니다. 연락처·주소 등
        개인정보는 적지 말아 주세요. 부적절한 글은 관리자가 삭제할 수 있습니다.
      </p>

      {view === "write" ? (
        <form
          className="notice-compose"
          onSubmit={submit}
          
        >
          <label>
            작성자 (닉네임) <input name="author" required maxLength={20} />
          </label>
          <label>
            제목 <input name="title" required maxLength={100} />
          </label>
          <label>
            내용 <textarea name="body" required maxLength={4000} rows={6} />
          </label>
          <label>
            글 비밀번호 (4자 이상, 내 글을 삭제할 때 필요)
            <input
              name="password"
              type="password"
              required
              minLength={4}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          {/* 매크로 방지용 함정 입력칸: 사람에게는 보이지 않습니다. */}
          <div className="hp-field" aria-hidden="true">
            <label>
              웹사이트
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="inquiry-actions">
            <button className="primary-button" disabled={busy}>
              {busy ? "등록 중…" : "등록"}
            </button>
            <button
              type="button"
              className="underlined-link"
              disabled={busy}
              onClick={() => {
                setView("list");
                setMessage("");
              }}
            >
              목록으로
            </button>
          </div>
        </form>
      ) : selected ? (
        <article className="inquiry-record">
          <h3>{selected.title}</h3>
          <p className="inquiry-meta">
            {selected.author || "익명"} · {date(selected.createdAt)}
          </p>
          <p className="inquiry-body">{selected.body}</p>
          {selected.reply && (
            <>
              <strong>
                관리자 답변
                {selected.repliedAt ? ` · ${date(selected.repliedAt)}` : ""}
              </strong>
              <p className="inquiry-body">{selected.reply}</p>
            </>
          )}
          <form className="inquiry-delete" onSubmit={removeOwn}>
            <label>
              글 비밀번호
              <input
                type="password"
                value={deletePassword}
                onChange={event => setDeletePassword(event.target.value)}
                maxLength={128}
                autoComplete="off"
              />
            </label>
            <button className="underlined-link" disabled={busy || !deletePassword}>
              내 글 삭제
            </button>
          </form>
          <button
            type="button"
            className="underlined-link"
            onClick={() => {
              setSelected(undefined);
              setMessage("");
            }}
          >
            목록으로
          </button>
        </article>
      ) : (
        <>
          <div className="inquiry-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setView("write");
                setOpenedAt(Date.now());
                setMessage("");
              }}
            >
              글쓰기
            </button>
          </div>
          {items.length ? (
            <ul className="inquiry-list">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="underlined-link"
                    disabled={busy}
                    onClick={() => void open(item.id)}
                  >
                    {item.title}
                  </button>
                  <span className="inquiry-meta">
                    {item.author} · {date(item.createdAt)}
                    {item.answered ? " · 답변 완료" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            !busy && <p>아직 등록된 글이 없습니다.</p>
          )}
          {next && (
            <button
              type="button"
              className="underlined-link"
              disabled={busy}
              onClick={() => void load(next)}
            >
              이전 글 더 보기
            </button>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
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

  async function remove(id: string) {
    if (
      !window.confirm(
        "이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(`${adminPath}?id=${encodeURIComponent(id)}`, "DELETE");
      setItems(previous => previous.filter(row => row.id !== id));
      if (selected?.id === id) setSelected(undefined);
      setMessage("글을 삭제했습니다.");
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="inquiry-section" aria-labelledby="admin-inquiry-title">
      <h2 id="admin-inquiry-title">문의 게시판 관리</h2>
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
                {item.title} · {item.author} · {date(item.createdAt)} ·{" "}
                {item.answered ? "답변 완료" : "답변 대기"}
                {item.legacy ? " · 이전 비공개 문의" : ""}
              </button>
              <button
                type="button"
                className="underlined-link danger-link"
                disabled={busy}
                onClick={() => void remove(item.id)}
              >
                삭제
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
          <p className="inquiry-body">{selected.body}</p>
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
            <div className="inquiry-actions">
              <button className="primary-button" disabled={busy}>
                답변 저장
              </button>
              <button
                type="button"
                className="underlined-link danger-link"
                disabled={busy}
                onClick={() => void remove(selected.id)}
              >
                이 글 삭제
              </button>
            </div>
          </form>
        </article>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
