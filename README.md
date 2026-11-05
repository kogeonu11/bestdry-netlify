# 세탁베스트드라이 · Netlify 공식 홈페이지

제주 제주시 외도동의 전문 세탁업체 세탁베스트드라이를 위한 한국어 상업용 홈페이지 소스입니다. 제공된 기존 홈페이지와 사진 자료를 참고해 프리미엄 브랜드 비주얼, 접근성에 유의한 반응형 화면, 실제 링크와 관리자 편집 도구를 갖췄습니다. 완성된 ZIP에는 SVG 로고와 파비콘, 최적화된 사진, SEO·Netlify 설정, 전체 소스, 한국어 배포 안내가 포함됩니다.

## 게시 전 매장 정보 확인

첨부 자료에 적힌 주소는 제주특별자치도 제주시 우정로 13길 10, 102호(1층)입니다. 지역, 대표전화 064-742-5484, 휴대전화 010-3422-8598, 평일 09:00–20:00, 토요일·공휴일 09:00–19:00, 일요일·명절 휴무, 점심시간 12:00–13:30, 대표자와 사업자 번호가 기본 데이터에 들어 있습니다. 이는 제공한 자료를 옮긴 것이며, 공개하기 전에 사업자가 최신 전화번호·영업시간과 사업자 정보를 확인해 주세요.

카카오 공식 상담 링크는 확인되지 않아 만들지 않았습니다. 수거·배달 여부도 현재 홈페이지에서 제공 중임을 확정하지 않습니다. 여섯 가지 세탁 항목은 안내 목록으로 보여 주며 기본값은 모두 ‘서비스 제공 여부 확인 필요’입니다. 세탁물이 실제로 접수 가능한지 매장에서 확인된 뒤 관리자 JSON에서 해당 항목의 `confirmed` 값을 `true`로 바꾸세요.

## Netlify 배포

ZIP을 해제하고 GitHub에 소스를 올린 뒤 Netlify의 **Add new project → Import an existing project**에서 저장소를 선택하세요. `netlify.toml`에 빌드 명령 `pnpm build:netlify`, 게시 디렉터리 `dist`, 함수 디렉터리 `netlify/functions`가 설정되어 있습니다. Node 20 이상과 pnpm 10.18.0을 사용합니다.

첫 배포 전에 Netlify **Project configuration → Environment variables**에 Functions용 비밀 변수 `ADMIN_PASSWORD`를 설정합니다. 강한 고유 암호를 사용하고 값은 Netlify 대시보드에만 입력하세요. 예시 생성 명령은 `openssl rand -base64 32`입니다. 비밀번호를 소스, ZIP, Git, 저장소의 `.env`, 클라이언트로 공개되는 `VITE_` 환경 변수에 넣지 마세요.

그런 다음 Netlify에서 최초 빌드를 실행하고, `https://<실제-Netlify-사이트>/admin`을 열어 새로 설정한 암호로 로그인합니다. Netlify Functions의 HttpOnly·Secure·SameSite=None 보안 쿠키는 로그인 상태를 보호합니다. 페이지 콘텐츠는 Netlify Blobs에 저장되므로, Netlify Blobs 실행 권한이 활성화된 배포에서 관리자 화면이 저장하는 정보를 새 배포 후에도 유지합니다. Netlify Function 실행 기록과 Blob 권한·용량은 정기적으로 확인하세요.

수동 CLI 배포는 Netlify 연결 권한이 있는 터미널에서 진행할 수 있습니다.

```sh
pnpm install --frozen-lockfile
pnpm exec netlify login
pnpm exec netlify init
# 실제 비밀번호는 대시보드의 Netlify 환경 변수에만 저장
pnpm build:netlify
pnpm exec netlify deploy --prod --build
```

실제 서비스 도메인을 `https://www.example.com` 같은 주소로 연결했으면 배포 전에 Netlify production 환경 변수 `PUBLIC_SITE_URL`에 해당 기본 HTTPS 도메인을 설정하세요. 그 도메인으로 올바른 `sitemap.xml`, `robots.txt`와 페이지별 canonical이 생성됩니다. 기본 Netlify 사이트에서는 공개된 production `URL` 환경 변수를 사용합니다. 도메인 DNS 등록, HTTPS 연결 및 실제 배포는 Netlify 대시보드에서 완료해야 합니다. 이 소스 ZIP만으로 특정 도메인에 공개 게시되지는 않습니다.

## 구글·네이버 검색 등록

1. 기존 Netlify 프로젝트의 배포 브랜치에 이 ZIP의 소스를 반영합니다. 맞춤 도메인을 쓴다면 Netlify 환경 변수 `PUBLIC_SITE_URL`에 방문자가 사용할 기본 HTTPS 주소를 입력합니다. 범위를 선택할 수 있으면 Builds와 Functions 모두에 적용합니다. 지정하지 않으면 Netlify 프로젝트의 기본 주소를 사용합니다.
2. [Google Search Console](https://search.google.com/search-console)에서 기본 HTTPS 주소를 URL 접두어 속성으로 추가합니다. 소유권 확인 방법에서 HTML 태그를 선택하고 `content` 값만 Netlify의 `GOOGLE_SITE_VERIFICATION`에 저장합니다.
3. [네이버 서치어드바이저](https://searchadvisor.naver.com/)의 웹마스터 도구에서 같은 주소를 등록합니다. HTML 태그의 `content` 값만 `NAVER_SITE_VERIFICATION`에 저장합니다. 두 확인 값은 Functions에서 읽을 수 있게 설정합니다.
4. Netlify에서 프로덕션 배포를 실행합니다. 기본 주소의 `/robots.txt`와 `/sitemap.xml`을 열어 사이트맵 주소와 페이지 URL이 실제 배포 주소와 일치하는지 확인합니다.
5. 두 서비스에서 소유 확인을 완료합니다. 구글은 **Sitemaps**에 `sitemap.xml`을 제출한 뒤 **URL 검사 → 색인 생성 요청**을 이용합니다. 네이버는 **요청 → 사이트맵 제출**에 사이트맵의 전체 HTTPS 주소를 제출한 뒤 **요청 → 웹 페이지 수집**에서 홈페이지를 요청합니다. 검색 결과 반영 상태는 각 서비스에서 확인할 수 있습니다.

## 관리자와 로컬 확인

`/admin`은 홈페이지 푸터의 '관리자 로그인' 또는 해당 경로에서 비밀번호로 로그인합니다. '공지사항' 탭에서 100건까지 제목·본문을 쉽게 작성하고 임시저장하거나 공개로 전환할 수 있습니다. 글을 편집하고 상단에 고정하거나 비공개 처리하고, 삭제 전 되돌릴 수 없다는 확인을 거칠 수 있습니다. 글·공개 여부 변경 후 관리자 화면 아래의 '변경 내용 저장'을 눌러 영구 반영하세요. 임시저장된 글은 공개 JSON API나 주소 검색으로 방문자가 읽을 수 없습니다. 게시된 글은 `/notices` 목록과 `/notices/<글ID>` 상세페이지, 홈의 최신 소식에서 공개됩니다.

같은 관리자에서 홈페이지 메인 문구·소개, 이미지 경로, 검색 제목·설명, 상호·연락처·주소·영업시간·대표자·사업자번호, 지도 URL, 세탁품목별 사진·설명·확인여부, 이용 안내 단계와 FAQ를 수정할 수 있습니다. 서비스·FAQ·단계 데이터는 JSON 편집 칸을 사용합니다. 입력 JSON에 문법 오류가 있으면 저장을 막습니다. 공식 카카오 URL은 관리자가 확인한 HTTPS 주소만 입력하세요.

로컬 개발에는 Node 20 이상과 pnpm 10.18.0이 필요합니다.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
# 복사한 .env의 ADMIN_PASSWORD 에는 로컬용 강한 값을 입력
pnpm dev
```

비밀 변수 없는 미리보기에서 관리자 데이터 수정은 활성화되지 않습니다. `.env` 파일과 고객 비밀번호를 ZIP이나 GitHub에 올리지 마세요.

## 페이지 및 개인정보

홈 `/`, 업체 소개 `/about`, 서비스 안내 `/services`, 이용 안내 `/guide`, 매장 안내와 지도 `/location`, 고객 문의·자주 묻는 질문 `/contact`, 공지 목록 `/notices`와 공개 글 상세 `/notices/<글ID>`, 개인정보 처리방침 `/privacy`, 비밀번호 보호 관리자 `/admin`을 제공합니다. 공지사항은 관리자의 열람용 안내이고 방문자 제출 폼이나 댓글은 없으므로 고객은 홈페이지에서 작성·등록할 수 없습니다. 전화 문의는 기기의 전화 앱에 연결하고 네이버·카카오 길찾기는 실제 주소를 검색합니다. 확인되지 않은 공식 카카오톡 URL은 연결하지 않습니다.

이 버전에서는 문의·예약 폼이나 방문자 글·댓글이 없으므로 홈페이지가 직접 이름이나 전화번호를 수집하지 않습니다. 개인정보 입력을 추가한다면 폼을 공개하기 전에 실제 항목·이용 목적·보관 기간·이용자 동의 절차를 확인하고 개인정보 처리방침을 업데이트하세요. 지도와 웹폰트 등 외부 서비스에는 각 제공자의 정책이 적용됩니다.

## 소스 구성

`client/src/pages/Home.tsx`에는 방문자 페이지, `client/src/pages/Admin.tsx`에는 비밀번호 보호 편집 화면, `client/src/index.css`에는 PC·태블릿·모바일 디자인이 있습니다. `client/public/`은 최적화된 매장 이미지와 브랜드 로고·파비콘을 보유합니다. `shared/content.ts`는 매장 정보·서비스 목록·검증 여부·단계별 절차·자주 묻는 질문과 입력 검증을, `netlify/functions/content.ts`는 관리자 로그인·콘텐츠 영속 저장을, `netlify/functions/render.ts`는 경로별 검색 메타데이터·검색 로봇 콘텐츠·404 응답을 관리합니다. `netlify.toml`은 정적 사이트와 서버리스 함수 빌드 및 보안 헤더를 설정합니다.
