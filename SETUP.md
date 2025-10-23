# QDS Design Auto - 설치 및 실행 가이드

## 🎯 Senior Next.js Engineer MVP Scaffolding

완전한 프로덕션 준비 스택:
- **Next.js 15** (App Router + TypeScript)
- **Tailwind CSS 3.4** + **shadcn/ui**
- **Prisma** (SQLite)
- **Playwright** (E2E + Screenshot)
- **v0.dev API** 연동

---

## 📦 1단계: 의존성 설치

### 기존 node_modules 정리 및 재설치

```bash
# 현재 디렉토리 확인
cd "/Users/skim15/dev/QDS Design auto"

# 기존 node_modules 제거 (Tailwind v4 → v3 다운그레이드)
rm -rf node_modules pnpm-lock.yaml

# 의존성 설치 (Tailwind v3 + shadcn/ui)
pnpm install

# Playwright 브라우저 설치
pnpm exec playwright install chromium

# Prisma 클라이언트 생성
pnpm prisma:generate
```

---

## 🔧 2단계: 환경 변수 설정

```bash
# .env.local 파일에 V0 API 키 설정
# 파일이 이미 생성되어 있으므로 키만 업데이트하세요
# V0_API_KEY=your_actual_v0_api_key_here
```

**V0 API 키 발급:**
1. https://v0.dev 접속
2. 로그인 후 Settings → API Keys
3. 새 API 키 생성
4. `.env.local` 파일에 붙여넣기

---

## 🚀 3단계: 개발 서버 실행

```bash
# 개발 서버 시작
pnpm dev

# 브라우저에서 확인
# http://localhost:3000
```

---

## 📁 프로젝트 구조

```
/Users/skim15/dev/QDS Design auto/
├── app/
│   ├── api/
│   │   ├── generate/route.ts       # v0 API 코드 생성
│   │   └── screenshot/route.ts     # Playwright 스크린샷
│   ├── preview/[id]/
│   │   ├── page.tsx                # 서버 컴포넌트
│   │   └── PreviewClient.tsx       # 샌드박스 렌더링
│   ├── layout.tsx                  # Root layout (Toast 포함)
│   ├── page.tsx                    # 메인 UI
│   └── globals.css                 # Tailwind + Design Tokens
├── components/
│   └── ui/                         # shadcn/ui 컴포넌트
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── scroll-area.tsx
│       ├── skeleton.tsx
│       ├── toast.tsx
│       └── toaster.tsx
├── hooks/
│   └── use-toast.ts                # Toast hook
├── lib/
│   ├── prisma.ts                   # Prisma 클라이언트
│   ├── utils.ts                    # cn() 유틸리티
│   └── design-tokens.json          # 디자인 토큰
├── prisma/
│   ├── schema.prisma               # DB 스키마
│   └── dev.db                      # SQLite 데이터베이스
├── scripts/
│   └── sync-tokens.ts              # 토큰 동기화 (placeholder)
├── tests/
│   └── example.spec.ts             # E2E 테스트
├── components.json                 # shadcn/ui 설정
├── tailwind.config.ts              # Tailwind 설정
├── postcss.config.mjs              # PostCSS 설정
├── playwright.config.ts            # Playwright 설정
└── .env.local.example              # 환경 변수 예시
```

---

## 🎨 주요 기능

### 1. 컴포넌트 생성
- 프롬프트 입력 → v0.dev AI가 React 코드 생성
- 디자인 토큰 기반 스타일 적용
- 실시간 미리보기

### 2. 샌드박스 렌더링
- 격리된 환경에서 안전하게 코드 실행
- `/preview/[id]` 경로로 미리보기 제공

### 3. 스크린샷 생성
- Playwright로 자동 스크린샷 캡처
- PNG 이미지로 저장 (`/public/screenshots/`)

### 4. 코드 다운로드
- 생성된 `.tsx` 코드 다운로드
- 이미지 파일 다운로드

---

## 📝 사용 가능한 스크립트

```bash
# 개발 서버
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# Prisma 마이그레이션
pnpm prisma:migrate

# Prisma Client 재생성
pnpm prisma:generate

# Prisma Studio (DB GUI)
pnpm prisma:studio

# 토큰 동기화 (향후 구현)
pnpm tokens:sync

# E2E 테스트
pnpm test:e2e
```

---

## 🧪 테스트 실행

```bash
# Playwright 테스트 (개발 서버 자동 시작)
pnpm test:e2e

# UI 모드로 테스트
pnpm exec playwright test --ui

# 특정 브라우저만
pnpm exec playwright test --project=chromium
```

---

## 🔐 보안 고려사항

1. **API Key 관리**: `.env.local`은 git에 커밋되지 않음
2. **코드 샌드박싱**: 생성된 코드는 격리된 환경에서 실행
3. **허용 클래스**: Tailwind 화이트리스트로 제한
4. **외부 네트워크 차단**: fetch 금지, 이미지는 placeholder 사용

---

## 🐛 트러블슈팅

### 1. Tailwind 클래스 적용 안 됨
```bash
# node_modules 재설치
rm -rf node_modules pnpm-lock.yaml .next
pnpm install
```

### 2. Prisma 에러
```bash
# Prisma Client 재생성
pnpm prisma:generate

# DB 초기화
rm prisma/dev.db
pnpm prisma:migrate
```

### 3. V0 API 500 에러
- `.env.local`의 `V0_API_KEY` 확인
- API 키가 유효한지 https://v0.dev 에서 확인

### 4. 스크린샷 실패
```bash
# Chromium 재설치
pnpm exec playwright install chromium --force
```

---

## 📚 다음 단계

- [ ] V0 API 키 발급 및 설정
- [ ] 첫 컴포넌트 생성 테스트
- [ ] 디자인 토큰 커스터마이징 (`lib/design-tokens.json`)
- [ ] shadcn/ui 컴포넌트 추가 설치
- [ ] E2E 테스트 작성
- [ ] Figma Variables API 연동 (선택)

---

## 🤝 기여

내부 프로젝트이므로 팀 내부에서만 사용합니다.


