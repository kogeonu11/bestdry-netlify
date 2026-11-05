import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  FilePlus2,
  Pencil,
  Pin,
  Trash2,
  X,
} from "lucide-react";
import { maxNoticeImageLength, type NoticePost } from "@shared/content";

type NoticeForm = {
  title: string;
  body: string;
  published: boolean;
  pinned: boolean;
  image?: string;
};
const blank = (): NoticeForm => ({
  title: "",
  body: "",
  published: false,
  pinned: false,
});
function dateLabel(value: string) {
  const date = Date.parse(value);
  return Number.isFinite(date)
    ? new Date(date).toLocaleDateString("ko-KR")
    : "";
}

export default function NoticeEditor({
  posts,
  onChange,
}: {
  posts: NoticePost[];
  onChange: (posts: NoticePost[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoticeForm>(blank);
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const ordered = useMemo(
    () => [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts],
  );

  function startNew() {
    setEditingId(null);
    setForm(blank());
    setError("");
    setMessage("");
  }
  function startEdit(post: NoticePost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      body: post.body,
      published: post.published,
      pinned: post.pinned,
      image: post.image,
    });
    setError("");
    setMessage("");
  }
  async function attachImage(file: File | undefined) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("10MB 이하의 JPG, PNG 또는 WebP 파일을 선택하세요.");
      return;
    }
    setLoadingImage(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      let image: string;
      try {
        const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image conversion unavailable");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        image = canvas.toDataURL("image/webp", 0.76);
        if (image.length > maxNoticeImageLength)
          image = canvas.toDataURL("image/webp", 0.5);
      } finally {
        bitmap.close();
      }
      if (image.length > maxNoticeImageLength) {
        setError("변환한 이미지가 너무 큽니다. 더 작은 이미지를 선택하세요.");
        return;
      }
      setForm((prev) => ({ ...prev, image }));
    } catch {
      setError("이미지를 읽을 수 없습니다. 다른 파일을 선택하세요.");
    } finally {
      setLoadingImage(false);
    }
  }
  function stagePost(event: React.FormEvent) {
    event.preventDefault();
    if (loadingImage) return;
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      setError("제목과 본문을 모두 입력해 주세요.");
      return;
    }
    if (!editingId && posts.length >= 100) {
      setError("공지사항은 최대 100개까지 저장할 수 있습니다.");
      return;
    }
    const existing = posts.find((post) => post.id === editingId);
    const now = new Date().toISOString();
    const post: NoticePost = {
      id: existing?.id ?? crypto.randomUUID(),
      title,
      body,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      published: form.published,
      pinned: form.pinned,
      image: form.image,
    };
    onChange([post, ...posts.filter((item) => item.id !== post.id)]);
    startNew();
    setMessage(
      "공지 목록에 반영했습니다. 아래 ‘변경 내용 저장’을 눌러 최종 저장해 주세요.",
    );
  }
  function toggle(post: NoticePost, field: "published" | "pinned") {
    onChange(
      posts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              [field]: !item[field],
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    setMessage(
      "공지 상태가 변경됐습니다. 아래 ‘변경 내용 저장’을 눌러 반영해 주세요.",
    );
  }
  function remove(post: NoticePost) {
    if (
      !window.confirm(
        `‘${post.title}’ 공지를 삭제할까요? 저장 후에는 되돌릴 수 없습니다.`,
      )
    )
      return;
    onChange(posts.filter((item) => item.id !== post.id));
    if (editingId === post.id) startNew();
    setMessage(
      "삭제할 공지를 목록에서 제외했습니다. 아래 ‘변경 내용 저장’을 눌러 최종 반영해 주세요.",
    );
  }

  return (
    <div className="notice-editor" aria-label="공지사항 관리">
      <div className="notice-editor-heading">
        <div>
          <p className="eyebrow">
            <Bell size={13} /> STORE UPDATES
          </p>
          <h2>공지사항 관리</h2>
          <p>새 소식을 작성한 뒤 상태를 확인하고 페이지 하단에서 저장하세요.</p>
        </div>
        <button
          type="button"
          className="notice-new-button"
          onClick={startNew}
          disabled={loadingImage}
        >
          <FilePlus2 size={16} /> 공지사항 작성하기
        </button>
      </div>
      <div className="notice-editor-grid">
        <form className="notice-compose" onSubmit={stagePost}>
          <div className="notice-compose-title">
            <span className="field-label">
              {editingId ? "공지 수정" : "공지 작성"}
            </span>
            {editingId && (
              <button
                type="button"
                className="icon-button"
                onClick={startNew}
                disabled={loadingImage}
                aria-label="수정 취소"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <label>
            <span className="field-label">제목</span>
            <input
              maxLength={100}
              required
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="공지 제목을 입력하세요"
            />
          </label>
          <label>
            <span className="field-label">내용</span>
            <textarea
              maxLength={10000}
              required
              rows={11}
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="방문 고객에게 안내할 공지 내용을 적어 주세요."
            />
          </label>
          <label>
            <span className="field-label">이미지 첨부 (1장)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={loadingImage}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                void attachImage(file);
              }}
            />
          </label>
          {loadingImage && <small role="status">이미지를 준비 중입니다.</small>}
          {form.image && (
            <div>
              <img
                className="notice-image-preview"
                src={form.image}
                alt="첨부 이미지 미리보기"
              />
              <button
                type="button"
                className="underlined-link"
                disabled={loadingImage}
                onClick={() =>
                  setForm((prev) => ({ ...prev, image: undefined }))
                }
              >
                이미지 제거
              </button>
            </div>
          )}
          <label className="notice-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, published: e.target.checked }))
              }
            />
            <span>
              <strong>바로 공개</strong>
              <small>
                선택 해제 시 임시저장되어 방문자에게 표시되지 않습니다.
              </small>
            </span>
          </label>
          <label className="notice-check">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pinned: e.target.checked }))
              }
            />
            <span>
              <strong>목록 상단에 고정</strong>
              <small>
                중요 안내가 공지목록과 홈페이지 미리보기 상단에 표시됩니다.
              </small>
            </span>
          </label>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary-button notice-stage-button"
            type="submit"
            disabled={loadingImage}
          >
            <Bell size={15} /> 목록에 반영
          </button>
          <small className="notice-save-hint">
            글 상태가 바뀐 뒤에는 아래쪽 <strong>변경 내용 저장</strong>을
            눌러야 실제로 반영됩니다.
          </small>
        </form>
        <section className="notice-admin-list" aria-label="작성한 공지사항">
          <div className="notice-admin-list-heading">
            <h3>등록 공지</h3>
            <span>{posts.length} / 100</span>
          </div>
          {ordered.length ? (
            ordered.map((post) => (
              <article className="notice-admin-card" key={post.id}>
                <div className="notice-admin-card-top">
                  <span
                    className={
                      post.published
                        ? "notice-state state-published"
                        : "notice-state"
                    }
                  >
                    {post.published ? (
                      <>
                        <Eye size={12} /> 공개
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} /> 임시저장
                      </>
                    )}
                  </span>
                  {post.pinned && (
                    <span className="notice-pin-label">
                      <Pin size={11} /> 상단 고정
                    </span>
                  )}
                  <time>{dateLabel(post.createdAt)}</time>
                </div>
                <h4>{post.title}</h4>
                <p>{post.body}</p>
                <div className="notice-card-actions">
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    disabled={loadingImage}
                  >
                    <Pencil size={13} /> 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(post, "published")}
                  >
                    {post.published ? (
                      <>
                        <EyeOff size={13} /> 비공개 전환
                      </>
                    ) : (
                      <>
                        <Eye size={13} /> 공개
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => toggle(post, "pinned")}>
                    {post.pinned ? (
                      <>
                        <Pin size={13} /> 고정 해제
                      </>
                    ) : (
                      <>
                        <Pin size={13} /> 상단 고정
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="notice-delete-button"
                    onClick={() => remove(post)}
                    disabled={loadingImage}
                  >
                    <Trash2 size={13} /> 삭제
                  </button>
                </div>
                {post.published && (
                  <a
                    className="notice-open-link"
                    target="_blank"
                    rel="noreferrer"
                    href={`/notices/${encodeURIComponent(post.id)}`}
                  >
                    공개 페이지 보기 <ArrowUpRight size={13} />
                  </a>
                )}
              </article>
            ))
          ) : (
            <p className="notice-admin-empty">
              등록된 공지가 없습니다. 첫 공지를 작성해 보세요.
            </p>
          )}
        </section>
      </div>
      <p className="notice-editor-message" role="status">
        {message}
      </p>
    </div>
  );
}
