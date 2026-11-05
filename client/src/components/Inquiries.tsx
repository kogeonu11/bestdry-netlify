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
  no: number;
  author: string;
  answered: boolean;
  legacy?: boolean;
};
type ListResult = {
  items: InquiryRow[];
  total: number;
  page: number;
  pages: number;
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

const pad = (n: number) => String(n).padStart(2, "0");
const today = new Date();
function shortDate(value: string) {
  const d = new Date(value);
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${String(d.getFullYear()).slice(2)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
const fullDate = (value: string) => {
  const d = new Date(value);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";

/** 번호 / 제목 / 글쓴이 / 날짜 게시판 표 */
function BoardTable({
  items,
  busy,
  onOpen,
  onDelete,
  activeId,
}: {
  items: InquiryRow[];
  busy: boolean;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  activeId?: string;
}) {
  return (
    <table className="board-table">
      <thead>
        <tr>
          <th className="col-no">번호</th>
          <th className="col-title">제목</th>
          <th className="col-author">글쓴이</th>
          <th className="col-date">날짜</th>
          {onDelete && <th className="col-del">관리</th>}
        </tr>
      </thead>
      <tbody>
        {items.length ? (
          items.map(item => (
            <tr key={item.id} className={item.id === activeId ? "active" : ""}>
              <td className="col-no">{item.no}</td>
              <td className="col-title">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onOpen(item.id)}
                >
                  {item.title}
                </button>
                {item.answered && <em className="board-badge">답변</em>}
                {item.legacy && <em className="board-badge muted">비공개</em>}
                <span className="board-mobile-meta">
                  {item.author} · {shortDate(item.createdAt)}
                </span>
              </td>
              <td className="col-author">{item.author}</td>
              <td className="col-date">{shortDate(item.createdAt)}</td>
              {onDelete && (
                <td className="col-del">
                  <button
                    type="button"
                    className="danger-link"
                    disabled={busy}
                    onClick={() => onDelete(item.id)}
                  >
                    삭제
                  </button>
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={onDelete ? 5 : 4} className="board-empty">
              {busy ? "불러오는 중…" : "등록된 글이 없습니다."}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const start = Math.floor((page - 1) / 10) * 10 + 1;
  const end = Math.min(start + 9, pages);
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <nav className="board-pages" aria-label="페이지">
      {start > 1 && (
        <button type="button" onClick={() => onPage(start - 1)}>
          ‹
        </button>
      )}
      {numbers.map(n => (
        <button
          key={n}
          type="button"
          className={n === page ? "current" : ""}
          aria-current={n === page ? "page" : undefined}
          onClick={() => onPage(n)}
        >
          {n}
        </button>
      ))}
      {end < pages && (
        <button type="button" onClick={() => onPage(end + 1)}>
          ›
        </button>
      )}
    </nav>
  );
}

function useBoardList(path: string) {
  const [list, setList] = useState<ListResult>({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  async function load(page = list.page) {
    setBusy(true);
    try {
      setList(await api<ListResult>(`${path}?page=${page}`));
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load(1);
  }, []);
  return { list, load, busy, setBusy, message, setMessage };
}

export function CustomerInquiries() {
  const [view, setView] = useState<"list" | "write">("list");
  const [selected, setSelected] = useState<Inquiry>();
  const [deletePassword, setDeletePassword] = useState("");
  const [openedAt, setOpenedAt] = useState(Date.now());
  const { list, load, busy, setBusy, message, setMessage } =
    useBoardList(publicPath);

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
      await api(publicPath, "POST", {
        ...values,
        elapsed: Date.now() - openedAt,
      });
      form.reset();
      setView("list");
      await load(1);
      setMessage("글이 등록되었습니다.");
    } catch (error) {
      setMessage(errorText(error));
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
      setSelected(undefined);
      await load(list.page);
      setMessage("글을 삭제했습니다.");
    } catch (error) {
      setMessage(errorText(error));
      setBusy(false);
    }
  }

  return (
    <section
      id="customer-inquiry"
      className="inner-body inquiry-section"
      aria-labelledby="inquiry-title"
    >
      <h2 id="inquiry-title">문의 사항</h2>
      <p className="inquiry-guide">
        부적절한 글은 매장 확인 후 삭제될 수 있습니다. 연락처·주소 등
        개인정보는 적지 말아 주세요.
      </p>

      {view === "write" ? (
        <form className="notice-compose" onSubmit={submit}>
          <label>
            글쓴이 (닉네임) <input name="author" required maxLength={20} />
          </label>
          <label>
            제목 <input name="title" required maxLength={100} />
          </label>
          <label>
            내용 <textarea name="body" required maxLength={4000} rows={8} />
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
              취소
            </button>
          </div>
        </form>
      ) : (
        <>
          {selected && (
            <article className="inquiry-record board-view">
              <h3>{selected.title}</h3>
              <p className="inquiry-meta">
                글쓴이 {selected.author || "익명"} ·{" "}
                {fullDate(selected.createdAt)}
              </p>
              <p className="inquiry-body">{selected.body}</p>
              {selected.reply && (
                <div className="board-reply">
                  <strong>
                    관리자 답변
                    {selected.repliedAt
                      ? ` · ${fullDate(selected.repliedAt)}`
                      : ""}
                  </strong>
                  <p className="inquiry-body">{selected.reply}</p>
                </div>
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
                <button
                  className="underlined-link"
                  disabled={busy || !deletePassword}
                >
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
                닫기
              </button>
            </article>
          )}
          <BoardTable
            items={list.items}
            busy={busy}
            activeId={selected?.id}
            onOpen={id => void open(id)}
          />
          <div className="board-footer">
            <Pagination
              page={list.page}
              pages={list.pages}
              onPage={page => void load(page)}
            />
            <button
              type="button"
              className="primary-button board-write"
              onClick={() => {
                setView("write");
                setOpenedAt(Date.now());
                setMessage("");
              }}
            >
              글쓰기
            </button>
          </div>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export function AdminInquiries() {
  const [selected, setSelected] = useState<Inquiry>();
  const [reply, setReply] = useState("");
  const { list, load, busy, setBusy, message, setMessage } =
    useBoardList(adminPath);

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
      setSelected(
        await api<Inquiry>(adminPath, "PUT", { id: selected.id, reply }),
      );
      await load(list.page);
      setMessage("답변을 저장했습니다. 게시글 아래에 공개로 표시됩니다.");
    } catch (error) {
      setMessage(errorText(error));
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다."))
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(`${adminPath}?id=${encodeURIComponent(id)}`, "DELETE");
      if (selected?.id === id) setSelected(undefined);
      await load(list.page);
      setMessage("글을 삭제했습니다.");
    } catch (error) {
      setMessage(errorText(error));
      setBusy(false);
    }
  }

  return (
    <section className="inquiry-section" aria-labelledby="admin-inquiry-title">
      <h2 id="admin-inquiry-title">문의 사항 관리</h2>
      <BoardTable
        items={list.items}
        busy={busy}
        activeId={selected?.id}
        onOpen={id => void open(id)}
        onDelete={id => void remove(id)}
      />
      <div className="board-footer">
        <Pagination
          page={list.page}
          pages={list.pages}
          onPage={page => void load(page)}
        />
      </div>
      {selected && (
        <article className="inquiry-record board-view">
          <h3>{selected.title}</h3>
          <p className="inquiry-meta">
            글쓴이 {selected.author || "익명"} · {fullDate(selected.createdAt)}
          </p>
          <p className="inquiry-body">{selected.body}</p>
          <form className="notice-compose" onSubmit={save}>
            <label>
              관리자 답변{" "}
              <textarea
                rows={5}
                maxLength={4000}
                required
                value={reply}
                onChange={event => setReply(event.target.value)}
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
