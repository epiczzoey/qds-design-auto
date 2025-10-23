# 🚀 배포 가이드

## GitHub 업로드

### 1. Git 초기화 및 커밋

```bash
cd /Users/skim15/dev/QDS-Design-auto

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: QDS Design Auto"
```

### 2. GitHub 저장소 생성 및 푸시

```bash
# GitHub에서 새 저장소 생성 후 (https://github.com/new)

# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/qds-design-auto.git

# 푸시
git branch -M main
git push -u origin main
```

---

## Vercel 배포 (읽기 전용 모드)

### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택: `qds-design-auto`
4. Framework Preset: **Next.js** (자동 감지)

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수 추가:

```
V0_API_KEY=your_v0_api_key_here
DATABASE_URL=file:./prisma/dev.db
```

⚠️ **주의**: `DATABASE_URL`은 설정해도 Vercel에서는 작동하지 않습니다 (파일 시스템 제한).

### 3. 빌드 설정

**Build Command**: `pnpm build`
**Output Directory**: `.next` (자동)
**Install Command**: `pnpm install`

### 4. 배포

"Deploy" 버튼 클릭 → 자동 배포 시작

---

## ⚠️ 제약사항 (읽기 전용 모드)

배포된 앱에서는 다음 기능이 **작동하지 않습니다**:

### ❌ 작동하지 않는 기능
- Generation 저장 (SQLite DB 없음)
- 히스토리 불러오기
- 스크린샷 생성 (Playwright 없음)
- 파일 업로드 저장

### ✅ 작동하는 기능
- UI/UX
- 이미지 업로드 (메모리, 새로고침 시 사라짐)
- v0 API 호출 (코드 생성)
- 실시간 미리보기
- 코드 다운로드

---

## 🔧 전체 기능 배포를 위한 마이그레이션

전체 기능을 사용하려면 다음 작업이 필요합니다:

### 1. DB 마이그레이션 (SQLite → PostgreSQL)

```bash
# Vercel Postgres 설치
pnpm add @vercel/postgres

# Prisma 스키마 수정
# datasource db {
#   provider = "postgresql"
#   url      = env("POSTGRES_PRISMA_URL")
# }

# 마이그레이션 생성
pnpm prisma migrate dev
```

### 2. 스크린샷 서비스 교체

옵션:
- **Puppeteer on Vercel Edge Functions** (제한적)
- **외부 스크린샷 API** (ApiFlash, ScreenshotAPI)
- **AWS Lambda + Puppeteer**

### 3. 파일 저장소 변경

```bash
# Vercel Blob 설치
pnpm add @vercel/blob

# S3 또는 Cloudinary 연동
```

---

## 📚 참고 자료

- [Vercel 배포 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)

---

## 🎯 추천 배포 방식

### 개발/테스트용
**Vercel (읽기 전용)** - 빠르고 간단, UI/UX 테스트

### 프로덕션용
**Vercel + PostgreSQL + Vercel Blob** - 전체 기능 지원

또는

**Railway / Render** - Node.js 앱 전체 호스팅 (SQLite 지원)

