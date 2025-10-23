# 📸 스크린샷 API 구현 완료

## 📦 변경된 파일 목록

### ✅ 수정된 파일

1. **app/api/screenshot/route.ts**
   - ✅ POST 엔드포인트: `{id, viewport?, fullPage?}` 받기
   - ✅ Headless Chromium으로 `/preview/:id` 캡처
   - ✅ `/public/screenshots/`에 PNG 저장
   - ✅ 타임아웃: 15초
   - ✅ 재시도: 1회 (2초 대기 후)
   - ✅ 에러 타입별 상세 메시지 (404, 400, 504, 500)
   - ✅ URL 반환 및 DB 업데이트

### ✅ 추가된 파일

2. **scripts/test-screenshot.sh**
   - 스크린샷 API 자동 테스트 스크립트
   - 5가지 테스트 케이스 포함
   - 실행 권한 부여됨

3. **docs/SCREENSHOT_API.md**
   - 완전한 API 문서
   - 사용 예시
   - 에러 처리 가이드
   - 트러블슈팅

---

## 🎯 구현된 기능

### 1. **POST /api/screenshot**

**요청**
```typescript
{
  id: string;              // Generation ID (필수)
  viewport?: {             // 뷰포트 (선택, 기본값: 1280x800)
    width: number;         // 320-3840
    height: number;        // 240-2160
  };
  fullPage?: boolean;      // 전체 페이지 캡처 (기본값: false)
}
```

**응답 (성공)**
```typescript
{
  screenshot_url: string;  // "/screenshots/[id]_[timestamp].png"
  success: true;
  filepath: string;        // 절대 경로
  filesize: number;        // 바이트 단위
}
```

**응답 (실패)**
```typescript
{
  error: string;           // 에러 메시지
  details?: string;        // 상세 정보
  retries?: number;        // 재시도 횟수 (1)
}
```

---

## 🔧 핵심 로직

### 1. **captureScreenshot() 함수**

```typescript
async function captureScreenshot(
  id: string,
  viewport: { width: number; height: number },
  fullPage: boolean,
  retryCount = 0
): Promise<ScreenshotResponse>
```

**플로우**:
1. ✅ DB에서 Generation 확인 (존재 여부, status === "completed")
2. ✅ Headless Chromium 실행
3. ✅ `/preview/:id` 페이지로 이동 (타임아웃: 15초)
4. ✅ 애니메이션 대기 (1초)
5. ✅ iframe 로드 대기 (타임아웃: 15초)
6. ✅ `page.screenshot()` 실행
7. ✅ 파일 크기 검증 (0바이트 체크)
8. ✅ 브라우저 종료
9. ✅ DB 업데이트 (Generation.screenshot_url, Asset 레코드)
10. ✅ 결과 반환

**재시도 로직**:
- 에러 발생 시 최대 1회 재시도
- 재시도 전 2초 대기
- 브라우저 인스턴스 확실하게 정리

---

## 🚀 실행 예시

### 1. 기본 사용

```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"id": "clxxx123456"}'
```

**응답**
```json
{
  "screenshot_url": "/screenshots/clxxx123456_1697123456789.png",
  "success": true,
  "filepath": "/path/to/public/screenshots/clxxx123456_1697123456789.png",
  "filesize": 153728
}
```

### 2. 커스텀 Viewport

```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clxxx123456",
    "viewport": {"width": 1920, "height": 1080}
  }'
```

### 3. Full Page 스크린샷

```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clxxx123456",
    "fullPage": true
  }'
```

### 4. TypeScript 클라이언트

```typescript
async function captureScreenshot(id: string) {
  const response = await fetch('/api/screenshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error);
  }

  return await response.json();
}

// 사용
const result = await captureScreenshot('clxxx123456');
console.log('Screenshot:', result.screenshot_url);
```

---

## 🧪 테스트 방법

### 자동 테스트

```bash
# Generation ID와 함께 실행
bash scripts/test-screenshot.sh clxxx123456
```

**테스트 항목**:
1. ✅ 기본 스크린샷 (1280x800)
2. ✅ 커스텀 viewport (1920x1080)
3. ✅ Full page 스크린샷
4. ✅ 잘못된 ID (404 에러)
5. ✅ 잘못된 viewport (400 에러)

### 수동 테스트

```bash
# 1. 개발 서버 실행
pnpm dev

# 2. Generation 생성 (Prisma Studio 또는 API)
pnpm prisma studio

# 3. 스크린샷 캡처
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"id": "[your-generation-id]"}'

# 4. 결과 확인
ls -lh public/screenshots/
# 브라우저: http://localhost:3000/screenshots/[filename].png
```

---

## 📊 에러 처리

### HTTP 상태 코드

| 코드 | 설명 | 예시 |
|------|------|------|
| 200 | 성공 | 스크린샷 생성 완료 |
| 400 | 잘못된 요청 | ID 누락, viewport 범위 초과 |
| 404 | 리소스 없음 | Generation을 찾을 수 없음 |
| 504 | 타임아웃 | 15초 내에 완료되지 않음 |
| 500 | 서버 오류 | 브라우저 크래시 등 |

### 에러 메시지 예시

#### 1. Generation 없음 (404)
```json
{
  "error": "Generation not found",
  "details": "Generation with id 'invalid-id' not found",
  "retries": 1
}
```

#### 2. 상태 불일치 (400)
```json
{
  "error": "Generation status is 'pending', expected 'completed'",
  "details": "...",
  "retries": 1
}
```

#### 3. 타임아웃 (504)
```json
{
  "error": "Screenshot capture timed out (15s limit)",
  "details": "Timeout 15000ms exceeded",
  "retries": 1
}
```

#### 4. Viewport 오류 (400)
```json
{
  "error": "Invalid viewport",
  "details": "Viewport width must be 320-3840px, height must be 240-2160px"
}
```

---

## ⚙️ 설정 값

### 타임아웃
```typescript
const TIMEOUT_MS = 15000; // 15초
```

### 재시도
```typescript
const MAX_RETRIES = 1; // 1회
```

### Viewport 범위
```typescript
{
  width: 320 ~ 3840,   // 최소 320px, 최대 4K
  height: 240 ~ 2160,  // 최소 240px, 최대 4K
  default: { width: 1280, height: 800 }
}
```

### Chromium 옵션
```typescript
{
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
  ]
}
```

### 스크린샷 옵션
```typescript
{
  path: "/public/screenshots/[id]_[timestamp].png",
  fullPage: false,
  type: "png",
  deviceScaleFactor: 2,  // Retina 해상도
}
```

---

## 📁 파일 구조

```
/Users/skim15/dev/QDS-Design-auto/
├── app/
│   └── api/
│       └── screenshot/
│           └── route.ts              # 스크린샷 API (수정됨)
├── public/
│   └── screenshots/                  # 생성된 스크린샷 저장 위치
│       ├── [id]_[timestamp].png
│       └── ...
├── scripts/
│   └── test-screenshot.sh            # 테스트 스크립트 (신규)
└── docs/
    └── SCREENSHOT_API.md             # API 문서 (신규)
```

---

## ✅ 요구사항 체크리스트

- [x] **app/api/screenshot/route.ts**: POST `{id, viewport?, fullPage?}` 받기
- [x] **Headless Chromium**: `/preview/:id` 페이지로 이동 및 캡처
- [x] **page.screenshot()**: PNG 파일 생성
- [x] **/public/screenshots/**: 파일 저장
- [x] **URL 반환**: screenshot_url 응답
- [x] **타임아웃**: 15초 설정
- [x] **재시도**: 1회 구현
- [x] **에러 메시지**: 타입별 상세 메시지 포함
- [x] **DB 업데이트**: Generation 및 Asset 테이블
- [x] **유효성 검사**: viewport 범위, Generation 상태 확인

---

## 🔄 DB 업데이트

### 1. Generation 테이블

```typescript
await db.generation.update({
  where: { id },
  data: { screenshot_url: '/screenshots/[id]_[timestamp].png' },
});
```

### 2. Asset 테이블

```typescript
await createAsset({
  generationId: id,
  kind: 'screenshot',
  path: screenshot_url,
});
```

---

## 🚨 트러블슈팅

### 1. "Browser launch failed"
```bash
# Playwright Chromium 설치
pnpm playwright install chromium
```

### 2. "Timeout exceeded"
- 컴포넌트 코드 최적화
- vendor 스크립트 확인 (`/public/vendor/`)
- 네트워크 상태 확인

### 3. "Permission denied"
```bash
# 디렉토리 권한 설정
mkdir -p public/screenshots
chmod 755 public/screenshots
```

### 4. "Screenshot file is empty"
- `/preview/:id` 페이지를 브라우저에서 직접 확인
- 브라우저 콘솔 에러 확인
- iframe 렌더링 확인

---

## 📊 성능

### 측정 결과 (예상)
- **평균 실행 시간**: 3-5초
- **최대 실행 시간**: 15초 (타임아웃)
- **재시도 포함**: 최대 32초 (15초 × 2 + 2초 대기)

### 로깅
```
[Screenshot] Request: id=clxxx123456, viewport={"width":1280,"height":800}, fullPage=false
[Screenshot] Navigating to: http://localhost:3000/preview/clxxx123456
[Screenshot] Page loaded successfully
[Screenshot] Screenshot saved: /path/to/public/screenshots/clxxx123456_1697123456789.png
[Screenshot] Success: /screenshots/clxxx123456_1697123456789.png
[Screenshot] Completed in 3542ms
```

---

## 🎉 완료!

모든 요구사항이 구현되었으며, 안전하고 확장 가능한 스크린샷 캡처 시스템이 완성되었습니다.

### 다음 단계 (선택사항)
- [ ] Queue 시스템 추가 (Bull, BullMQ)
- [ ] Browser 인스턴스 풀링
- [ ] 스크린샷 캐싱
- [ ] 썸네일 자동 생성
- [ ] S3 업로드 지원
- [ ] Webhook 알림

---

## 📞 문의

추가 질문이나 개선 사항이 있으면 `docs/SCREENSHOT_API.md`를 참고하세요.

