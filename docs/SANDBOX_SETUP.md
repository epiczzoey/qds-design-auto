# 🔒 Sandbox iframe 렌더링 시스템

## 📋 개요

저장된 React 컴포넌트 코드를 안전하게 샌드박스 iframe에서 렌더링하는 시스템입니다.

## 🏗️ 아키텍처

### 1. **app/preview/[id]/page.tsx**
- 서버 컴포넌트
- DB에서 Generation 데이터 로드 (Prisma)
- `code` 필드를 `PreviewClient`로 전달

### 2. **app/preview/[id]/PreviewClient.tsx**
- 클라이언트 컴포넌트
- `Sandbox` 컴포넌트를 렌더링

### 3. **components/Sandbox.tsx**
- iframe 기반 샌드박스 렌더링
- `sandbox="allow-scripts"` 속성으로 스크립트만 허용
- `srcDoc`을 사용하여 HTML 문서 주입
- 에러 핸들링 (postMessage 기반)

### 4. **lib/sandbox-template.ts**
- `buildSrcDoc(code)`: 코드를 HTML 문서로 변환
- `buildErrorSrcDoc(error)`: 에러 표시 HTML 생성
- tokens.json을 사용하여 스타일링

## 🔐 보안 정책 (CSP)

```
default-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self';
```

### 보안 특징
- ✅ **외부 리소스 완전 차단** (`default-src 'none'`)
- ✅ **로컬 스크립트만 허용** (`script-src 'self'`)
- ✅ **인라인 스타일 허용** (`style-src 'unsafe-inline'` - 동적 스타일링을 위해)
- ✅ **로컬 이미지만 허용** (`img-src 'self'`)
- ✅ **폼 제출 차단** (sandbox 속성)
- ✅ **네비게이션 차단** (sandbox 속성)

## 📦 Vendor 스크립트

로컬 UMD 스크립트 사용:
- `/vendor/react.production.min.js` (React 18.2.0)
- `/vendor/react-dom.production.min.js` (ReactDOM 18.2.0)
- `/vendor/babel-standalone.min.js` (Babel 7.23.5)

### 다운로드 방법
```bash
bash scripts/download-vendor.sh
```

## 🎨 Design Tokens 통합

`tokens.json`의 색상을 iframe에 자동 적용:
- **배경색**: `colors.bg` (#0B0B0C)
- **전경색**: `colors.fg` (#F3F4F6)
- **기타 색상**: primary, secondary, muted, accent, destructive 등

### CSS 변수로 제공
```css
:root {
  --color-bg: #0B0B0C;
  --color-fg: #F3F4F6;
  --color-primary: #2563EB;
  /* ... */
}
```

### JavaScript에서 접근
```javascript
window.tokens // 전체 tokens.json 객체
```

## 🚀 렌더링 플로우

1. **코드 로드**
   ```typescript
   const generation = await db.generation.findUnique({ where: { id } });
   ```

2. **HTML 생성**
   ```typescript
   const srcDoc = buildSrcDoc(generation.code);
   ```

3. **iframe 렌더링**
   ```tsx
   <iframe srcDoc={srcDoc} sandbox="allow-scripts" />
   ```

4. **React 마운트**
   ```javascript
   const root = ReactDOM.createRoot(container);
   root.render(React.createElement(ComponentName));
   ```

## 📝 컴포넌트 코드 형식

생성된 코드는 다음 형식을 따라야 합니다:

```tsx
export default function MyComponent() {
  const [state, setState] = useState(0);
  
  return (
    <div style={{
      backgroundColor: window.tokens.colors.bg,
      color: window.tokens.colors.fg
    }}>
      <h1>Hello, World!</h1>
    </div>
  );
}
```

### 주의사항
- ✅ `export default function ComponentName()` 형식 필수
- ✅ React Hooks는 `React.useState`, `React.useEffect` 등으로 사용 가능
- ✅ `window.tokens`로 디자인 토큰 접근 가능
- ❌ import 문 사용 불가 (모든 의존성은 전역 변수로 제공)
- ❌ 외부 라이브러리 사용 불가 (React만 사용 가능)

## 🐛 에러 핸들링

### 1. 빌드타임 에러
`Sandbox.tsx`에서 에러를 감지하고 `buildErrorSrcDoc()`로 에러 표시

### 2. 런타임 에러
iframe 내부에서 `window.addEventListener('error')`로 에러를 감지하고 UI에 표시

### 3. 컴포넌트 찾기 실패
`export default function` 패턴이 없으면 에러 메시지 표시

## 🧪 테스트 방법

1. **DB에 샘플 코드 추가**
   ```typescript
   await db.generation.create({
     data: {
       prompt: "Test component",
       code: `export default function TestComponent() {
         return <div>Hello, Sandbox!</div>;
       }`,
       status: "completed"
     }
   });
   ```

2. **프리뷰 페이지 방문**
   ```
   http://localhost:3000/preview/[generated-id]
   ```

## 📊 파일 구조

```
/Users/skim15/dev/QDS-Design-auto/
├── app/
│   └── preview/
│       └── [id]/
│           ├── page.tsx              # 서버: DB 로드
│           └── PreviewClient.tsx     # 클라이언트: Sandbox 렌더링
├── components/
│   └── Sandbox.tsx                   # iframe 샌드박스 컴포넌트
├── lib/
│   ├── sandbox-template.ts           # HTML 템플릿 빌더
│   └── design-tokens.json            # (deprecated, use tokens.json)
├── public/
│   └── vendor/
│       ├── react.production.min.js
│       ├── react-dom.production.min.js
│       └── babel-standalone.min.js
├── scripts/
│   └── download-vendor.sh            # Vendor 스크립트 다운로드
├── tokens.json                       # Design Tokens (색상, 폰트 등)
└── docs/
    └── SANDBOX_SETUP.md              # 이 문서
```

## 🔄 업데이트 가이드

### Vendor 스크립트 업데이트
```bash
# 최신 버전으로 업데이트
cd /Users/skim15/dev/QDS-Design-auto
bash scripts/download-vendor.sh
```

### Design Tokens 업데이트
`tokens.json` 수정 후 자동으로 반영됩니다.

## 🚨 트러블슈팅

### 1. "Component not found" 에러
- 코드가 `export default function ComponentName()` 형식인지 확인
- 함수명에 공백이나 특수문자가 없는지 확인

### 2. Vendor 스크립트 404 에러
- `public/vendor/` 디렉토리에 파일이 있는지 확인
- `bash scripts/download-vendor.sh` 실행

### 3. CSP 오류
- 브라우저 콘솔에서 CSP 위반 확인
- 외부 리소스(CDN 등)를 사용하지 않았는지 확인

### 4. 스타일이 적용되지 않음
- `tokens.json`이 올바른지 확인
- `window.tokens`로 접근 가능한지 확인

## 📚 참고 자료

- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
- [React UMD builds](https://react.dev/learn/add-react-to-an-existing-project#step-1-set-up-a-modular-javascript-environment)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone)

