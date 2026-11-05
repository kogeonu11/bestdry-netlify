import React, { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  // Netlify Forms 인코딩 헬퍼 함수
  const encode = (data) => {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(Object.fromEntries(formData)),
    })
      .then(() => setSubmitted(true))
      .catch((error) => alert('제출 중 오류가 발생했습니다: ' + error));
  };

  if (submitted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>문의가 성공적으로 접수되었습니다!</h3>
        <p>확인 후 빠르게 답변드리겠습니다.</p>
        <button onClick={() => setSubmitted(false)}>추가 문의 작성하기</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>문의하기</h2>
      <form
        name="contact"
        method="POST"
        data-netlify="true"
        onSubmit={handleSubmit}
      >
        {/* React 단에서 Netlify 감지를 위한 hidden input */}
        <input type="hidden" name="form-name" value="contact" />

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>성함 / 상호명</label>
          <input
            type="text"
            name="name"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>연락처 / 이메일</label>
          <input
            type="text"
            name="contact_info"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>문의 내용</label>
          <textarea
            name="message"
            rows="5"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          ></textarea>
        </div>

        <button
          type="submit"
          style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          문의하기 제출
        </button>
      </form>
    </div>
  );
}