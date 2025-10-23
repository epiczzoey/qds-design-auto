# QDS Design Auto

디자인 시스템 기반 자동 컴포넌트 생성 도구

## 개요

v0.app API를 활용하여 지정된 디자인 시스템 스타일로 프롬프트를 입력하면 React/Next.js 코드와 미리보기를 자동 생성하는 내부 도구입니다.

## 주요 기능

- 🎨 디자인 시스템 토큰 기반 컴포넌트 생성
- 🤖 v0.dev AI를 통한 자동 코드 생성
- 👁️ 실시간 미리보기 (샌드박스 iframe)
- 📸 Playwright 기반 스크린샷 생성
- 💾 생성 이력 관리 (SQLite)
- ⬇️ 코드 및 이미지 다운로드

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **데이터베이스**: SQLite + Prisma
- **스크린샷**: Playwright (Chromium)
- **AI**: v0.dev Model API

## 시작하기

### 사전 요구사항

- Node.js 18+ (LTS)
- pnpm
- v0.dev API Key

### 설치

1. 의존성 설치:
```bash
pnpm install
```

2. 환경 변수 설정:
`.env.local` 파일에 v0 API 키를 설정하세요:
```bash
V0_API_KEY=your_v0_api_key_here
DATABASE_URL="file:./dev.db"
```

3. 데이터베이스 초기화:
```bash
pnpm prisma generate
```

### 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
.
├── app/
│   ├── api/
│   │   ├── generate/         # v0 API 연동 (코드 생성)
│   │   └── screenshot/        # Playwright 스크린샷
│   ├── preview/[id]/          # 샌드박스 미리보기 페이지
│   ├── layout.tsx
│   ├── page.tsx               # 메인 UI
│   └── globals.css            # Tailwind + 디자인 토큰
├── lib/
│   ├── prisma.ts              # Prisma 클라이언트
│   └── design-tokens.json     # 디자인 시스템 토큰
├── prisma/
│   └── schema.prisma          # DB 스키마
└── public/
    └── screenshots/           # 생성된 스크린샷
```

## 사용법

1. **스타일 프리셋 선택**: 현재는 Default (Dark) 프리셋 제공
2. **프롬프트 입력**: 원하는 컴포넌트를 자연어로 설명
3. **생성하기**: v0 AI가 디자인 토큰 기반 코드 생성
4. **미리보기**: 실시간으로 생성된 컴포넌트 확인
5. **스크린샷**: 필요시 PNG 이미지로 저장
6. **다운로드**: 코드(.tsx) 또는 이미지 다운로드

## 성능 목표 & 품질 기준

### 성능 목표 (SLO)

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 코드 생성 시간 | p95 < 30초 | 프롬프트 입력 → 코드 반환 |
| 스크린샷 생성 | p95 < 15초 | API 호출 → 이미지 저장 |
| 렌더링 성공률 | ≥ 95% | 유효한 코드 / 전체 요청 |
| API 가용성 | ≥ 99% | 월간 uptime |

### 품질 가드

- ✅ **코드 검증**: 외부 리소스, 위험한 API 차단
- ✅ **자동 재시도**: 실패 시 최대 1회 재시도
- ✅ **타임아웃**: 15초 초과 시 타임아웃
- ✅ **로깅**: 구간별 성능 측정 (모델 호출, 렌더링, 스크린샷)

## 시연 체크리스트

시연 전 아래 항목을 확인하세요:

### 환경 설정 ✓

- [ ] `.env.local`에 `V0_API_KEY` 설정 완료
- [ ] `pnpm install` 완료
- [ ] `pnpm prisma generate` 실행
- [ ] `pnpm dev` 실행 (http://localhost:3000)
- [ ] `public/vendor/` 스크립트 다운로드 완료
- [ ] Chromium 설치 (`pnpm playwright install chromium`)

### 핵심 기능 테스트 ✓

1. **코드 생성**
   - [ ] 프롬프트 입력 → 생성하기 클릭
   - [ ] 30초 이내 코드 생성 완료
   - [ ] Preview 탭에서 컴포넌트 렌더링 확인
   - [ ] Code 탭에서 코드 확인

2. **템플릿 자동 감지**
   - [ ] "로그인 폼" 입력 → form 템플릿 적용 확인
   - [ ] "랜딩 페이지" 입력 → landing 템플릿 적용 확인
   - [ ] "프로필 카드" 입력 → card 템플릿 적용 확인

3. **스크린샷**
   - [ ] [스크린샷 생성] 버튼 클릭
   - [ ] 15초 이내 이미지 생성 완료
   - [ ] 이미지 다운로드 가능 확인

4. **히스토리**
   - [ ] 하단 히스토리 섹션에서 생성 목록 확인
   - [ ] 썸네일 클릭 → 이전 생성 불러오기 확인

5. **다운로드**
   - [ ] 코드 다운로드 (.tsx) 정상 동작
   - [ ] 이미지 다운로드 (.png) 정상 동작

### 품질 & 성능 ✓

- [ ] 브라우저 콘솔에서 로그 확인 (구간별 성능)
- [ ] 에러 발생 시 Toast 알림 표시 확인
- [ ] Status 위젯에서 성공률 확인 (선택)
- [ ] 테스트 실행: `pnpm test` (모든 테스트 통과)

### 회귀 테스트 프롬프트 (10개)

시연 전 아래 프롬프트로 정상 동작을 확인하세요:

1. **버튼 컴포넌트**
   ```
   Create a simple button component with primary and secondary variants
   ```
   - 예상: Button 컴포넌트, 2가지 스타일

2. **로그인 폼**
   ```
   Build a login form with email and password fields, and a submit button
   ```
   - 예상: Form 템플릿 적용, Input 컴포넌트 사용

3. **프로필 카드**
   ```
   Design a user profile card with avatar, name, email, and follower count
   ```
   - 예상: Card 템플릿 적용, 깔끔한 레이아웃

4. **네비게이션 바**
   ```
   Make a responsive navigation bar with logo and menu items
   ```
   - 예상: Header, 모바일 반응형

5. **가격 테이블**
   ```
   Create a pricing table with 3 tiers: Basic, Pro, and Enterprise
   ```
   - 예상: Grid 레이아웃, Card 컴포넌트

6. **후기 섹션**
   ```
   Build a testimonial section with 3 customer reviews
   ```
   - 예상: Grid, 인용문 스타일

7. **기능 그리드**
   ```
   Design a feature grid with icons and descriptions for 6 features
   ```
   - 예상: Grid 레이아웃, 아이콘 영역

8. **뉴스레터 폼**
   ```
   Create a newsletter signup form with email input and subscribe button
   ```
   - 예상: Form, 간단한 레이아웃

9. **푸터**
   ```
   Build a footer with company info, links, and social media icons
   ```
   - 예상: 다단 레이아웃, 링크 그룹

10. **Hero 섹션**
    ```
    Design a hero section with headline, subheadline, and two CTA buttons
    ```
    - 예상: Landing 템플릿 적용, 큰 타이포그래피

### 예상 문제 해결 ✓

| 문제 | 해결 방법 |
|------|-----------|
| V0_API_KEY 오류 | `.env.local` 파일 확인 및 재시작 |
| 스크린샷 404 | `pnpm playwright install chromium` 실행 |
| Vendor 스크립트 404 | `bash scripts/download-vendor.sh` 실행 |
| DB 에러 | `pnpm prisma migrate dev` 실행 |
| 포트 충돌 (3000) | 다른 Next.js 앱 종료 또는 포트 변경 |

## 테스트

### 테스트 실행

```bash
# 모든 테스트 실행
pnpm test

# 커버리지 리포트
pnpm test --coverage

# 특정 테스트 파일
pnpm test code-guard.test.ts
```

### 테스트 종류

- **코드 가드 테스트** (`tests/code-guard.test.ts`): 생성된 코드 검증
- **회귀 테스트**: 10개 표준 프롬프트로 자동 검증
- **성능 테스트**: 구간별 시간 측정 (< 100ms)

## 보안

- ✅ 허용된 Tailwind 클래스만 사용 (화이트리스트)
- ✅ Sandbox iframe으로 격리된 렌더링 (`sandbox="allow-scripts"`)
- ✅ 외부 네트워크 요청 차단 (fetch, axios 금지)
- ✅ XSS 방지 (dangerouslySetInnerHTML, eval 금지)
- ✅ CSP 적용 (`default-src 'none'`)
- ✅ API Key는 서버 전용 (클라이언트 노출 금지)

## 관측성 (Observability)

### 로깅

구조화된 로깅 시스템 (`lib/logger.ts`):
- **INFO**: 정상 동작 (Generation 생성, 완료)
- **WARN**: 경고 (검증 실패, 성능 임계값 초과)
- **ERROR**: 에러 (API 호출 실패, 시스템 오류)

### 성능 메트릭

구간별 시간 측정:
- `MODEL_CALL`: V0 API 호출 시간 (목표: < 30초)
- `VALIDATION`: 코드 검증 시간 (목표: < 1초)
- `SCREENSHOT`: 스크린샷 생성 시간 (목표: < 15초)
- `GENERATION_TOTAL`: 전체 생성 시간 (목표: < 60초)

### Status 위젯 (선택)

페이지 하단에서 실시간 상태 확인:
- 성공률 (Success Rate)
- 평균 응답 시간 (Avg Response Time)
- 요청 수 (Total / Success / Failed)
- 최근 에러 메시지

**사용법**:
```tsx
import StatusWidget from "@/components/StatusWidget";

// Layout 또는 Page에 추가
<StatusWidget />
```

## 로드맵

- [x] M0: 기본 스캐폴딩 및 v0 연동
- [x] M1: 스크린샷 기능 + 디자인 토큰
- [ ] M2: 프롬프트 템플릿 + 이력 조회
- [ ] 추후: shadcn/ui 컴포넌트 통합
- [ ] 추후: Figma Variables API 연동

## 라이선스

내부 사용 전용

## 문의

프로젝트 관련 문의사항은 팀 채널을 통해 연락주세요.
