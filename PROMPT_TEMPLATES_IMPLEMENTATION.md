# 🎯 프롬프트 템플릿 시스템 구현 완료

## 📋 개요

일관된 사용자 프롬프트를 구성하는 유틸리티 시스템 구축:
- 3가지 템플릿: landing, form, card
- tokens.json 기반 화이트리스트 자동 생성
- 자동 템플릿 감지

## 📦 변경된 파일 목록

### ✅ 추가된 파일

1. **lib/prompt-templates.ts** (신규 - 320 lines)
   - ✅ `buildWhitelistString(tokens)`: tokens 기반 화이트리스트 문자열 생성
   - ✅ `buildSystemPrompt(tokens)`: SYSTEM_PROMPT 생성
   - ✅ `buildUserPrompt(prompt, tokens, template, retryReason?)`: USER_PROMPT 생성
   - ✅ `detectTemplateType(prompt)`: 자동 템플릿 감지
   - ✅ `getStylePresetContext(style)`: 스타일 프리셋 컨텍스트
   - ✅ 3가지 템플릿: landing, form, card, general

### ✅ 수정된 파일

2. **app/api/generate/route.ts** (리팩터링)
   - ✅ prompt-templates.ts import 및 사용
   - ✅ 템플릿 자동 감지 로직 추가
   - ✅ systemPrompt와 userPrompt 분리
   - ✅ 응답에 template 정보 포함

### ✅ 문서

3. **PROMPT_TEMPLATES_IMPLEMENTATION.md** (이 파일)
   - 구현 요약
   - 사용 가이드
   - 템플릿 예시

---

## 🏗️ 아키텍처

### 1. 화이트리스트 생성

```typescript
buildWhitelistString(tokens) → string
```

**입력**: tokens.json
**출력**: Tailwind 클래스 화이트리스트 문자열

```
ALLOWED COLOR CLASSES:
bg-bg, bg-fg, bg-primary, text-bg, text-fg, border-bg, ...

ALLOWED BORDER RADIUS:
rounded-sm, rounded-md, rounded-lg, rounded-xl

ALLOWED SPACING (use with p-, m-, gap-, space- prefixes):
xs, sm, md, lg, xl, 2xl, 3xl, 4xl

ALLOWED SHADOWS:
shadow-sm, shadow-md, shadow-lg, shadow-xl

ALLOWED FONTS:
font-sans, font-mono
```

---

### 2. SYSTEM_PROMPT 생성

```typescript
buildSystemPrompt(tokens) → string
```

**특징**:
- tokens 기반 화이트리스트 자동 삽입
- shadcn/ui 컴포넌트 목록
- 제한 사항 명시
- 출력 형식 정의

**예시**:
```
You are a React component generator...

STYLING & DESIGN (WHITELIST ONLY):
[화이트리스트 자동 삽입]

ALLOWED COMPONENTS:
- shadcn/ui: Button, Card, Input, Textarea, ...

RESTRICTIONS:
- ❌ NO external network requests
- ❌ NO external images
...
```

---

### 3. USER_PROMPT 생성

```typescript
buildUserPrompt(
  prompt: string,
  tokens: typeof tokens,
  template: TemplateType,
  retryReason?: string
) → string
```

**입력**:
- `prompt`: 사용자 프롬프트
- `tokens`: tokens.json
- `template`: landing | form | card | general
- `retryReason`: 재시도 사유 (선택)

**출력**:
```
Design System Context:
────────────────────────────────────────────────────────────────

DESIGN TOKENS (from tokens.json):
[tokens 정보]

────────────────────────────────────────────────────────────────

TEMPLATE TYPE: LANDING

[템플릿별 가이드라인]

────────────────────────────────────────────────────────────────

USER REQUEST:
[사용자 프롬프트]

────────────────────────────────────────────────────────────────

IMPORTANT REMINDERS:
[중요 사항]
```

---

## 🎨 템플릿 시스템

### 1. **Landing Page Template**

**키워드**: landing, hero, 홈페이지, 메인 페이지, 랜딩

**가이드라인**:
```
LANDING PAGE GUIDELINES:
- Create a full-page hero section with eye-catching visuals
- Include clear call-to-action (CTA) buttons
- Use large, bold typography for headings
- Implement sections: Hero, Features, Testimonials, CTA
- Use gradient backgrounds and modern spacing
- Ensure mobile responsiveness
- Add hover effects and smooth transitions
```

**사용 예시**:
```
프롬프트: "현대적인 SaaS 제품 랜딩 페이지를 만들어주세요"
→ 자동으로 'landing' 템플릿 적용
```

---

### 2. **Form Template**

**키워드**: form, login, signup, register, input, 폼, 로그인, 회원가입, 입력

**가이드라인**:
```
FORM GUIDELINES:
- Use shadcn/ui Input and Textarea components
- Include proper label and placeholder text
- Add form validation hints (e.g., "Email is required")
- Use Card component for form container
- Include submit button with loading state
- Show error states with text-destructive
- Use consistent spacing between fields (space-y-4)
- Add focus states with ring-primary
```

**사용 예시**:
```
프롬프트: "이메일과 비밀번호로 로그인하는 폼 만들어줘"
→ 자동으로 'form' 템플릿 적용
```

---

### 3. **Card Template**

**키워드**: card, profile, product, 카드, 프로필, 상품

**가이드라인**:
```
CARD GUIDELINES:
- Use shadcn/ui Card component with CardHeader, CardTitle, CardContent
- Keep content concise and well-organized
- Use consistent padding and spacing
- Include subtle hover effects (hover:scale-105)
- Add border and shadow for depth
- Use muted background for contrast
- Include relevant icons if appropriate
- Ensure readable typography hierarchy
```

**사용 예시**:
```
프롬프트: "사용자 프로필 카드 컴포넌트"
→ 자동으로 'card' 템플릿 적용
```

---

### 4. **General Template**

**기본값**: 위 키워드에 해당하지 않는 경우

**가이드라인**:
```
GENERAL GUIDELINES:
- Follow modern UI/UX best practices
- Use semantic HTML elements
- Ensure accessibility (ARIA labels, keyboard navigation)
- Create responsive layouts
- Use consistent color palette from design tokens
- Add smooth transitions and hover effects
```

---

## 🔧 핵심 함수

### 1. buildWhitelistString()

```typescript
export function buildWhitelistString(designTokens: typeof tokens): string {
  const { colors, radius, spacing, shadow } = designTokens;

  // 색상 클래스
  const colorClasses = Object.keys(colors)
    .flatMap((key) => [
      `bg-${key}`,
      `text-${key}`,
      `border-${key}`,
      `ring-${key}`,
      `from-${key}`,
      `to-${key}`,
      `via-${key}`,
    ])
    .join(", ");

  // ... 나머지 클래스
  
  return `ALLOWED COLOR CLASSES: ${colorClasses} ...`;
}
```

---

### 2. buildSystemPrompt()

```typescript
export function buildSystemPrompt(designTokens: typeof tokens): string {
  const whitelist = buildWhitelistString(designTokens);

  return `You are a React component generator...
  
STYLING & DESIGN (WHITELIST ONLY):
${whitelist}

...`;
}
```

---

### 3. buildUserPrompt()

```typescript
export function buildUserPrompt(
  prompt: string,
  designTokens: typeof tokens,
  template: TemplateType = "general",
  retryReason?: string
): string {
  // 템플릿별 가이드라인
  const templateGuideline = TEMPLATE_GUIDELINES[template];

  let userPrompt = `Design System Context:
...
TEMPLATE TYPE: ${template.toUpperCase()}
${templateGuideline}
...
USER REQUEST:
${prompt}
`;

  // 재시도 사유 추가
  if (retryReason) {
    userPrompt += `\n⚠️ RETRY REQUIRED: ${retryReason}`;
  }

  return userPrompt;
}
```

---

### 4. detectTemplateType()

```typescript
export function detectTemplateType(prompt: string): TemplateType {
  const lowerPrompt = prompt.toLowerCase();

  // Landing page 키워드
  if (
    lowerPrompt.includes("landing") ||
    lowerPrompt.includes("hero") ||
    lowerPrompt.includes("홈페이지") ||
    lowerPrompt.includes("랜딩")
  ) {
    return "landing";
  }

  // Form 키워드
  if (
    lowerPrompt.includes("form") ||
    lowerPrompt.includes("login") ||
    lowerPrompt.includes("로그인")
  ) {
    return "form";
  }

  // Card 키워드
  if (
    lowerPrompt.includes("card") ||
    lowerPrompt.includes("profile") ||
    lowerPrompt.includes("카드")
  ) {
    return "card";
  }

  // 기본값
  return "general";
}
```

---

## 🔄 API 변경 사항

### 요청 (추가)

```typescript
POST /api/generate
{
  "prompt": "현대적인 로그인 폼",
  "style": "default",
  "template": "form"  // ← 선택적 (없으면 자동 감지)
}
```

### 응답 (추가)

```typescript
{
  "id": "clxxx123456",
  "code": "export default function...",
  "status": "completed",
  "attempts": 1,
  "template": "form"  // ← 사용된 템플릿 정보
}
```

---

## 📝 사용 예시

### 예시 1: Landing Page

**프롬프트**:
```
"SaaS 제품을 위한 현대적인 랜딩 페이지를 만들어주세요. 
Hero 섹션과 Features, CTA가 필요합니다."
```

**자동 감지**: `landing`

**생성된 프롬프트**:
```
Design System Context:
────────────────────────────────────────
DESIGN TOKENS...
────────────────────────────────────────
TEMPLATE TYPE: LANDING

LANDING PAGE GUIDELINES:
- Create a full-page hero section...
- Include clear call-to-action...
...

USER REQUEST:
SaaS 제품을 위한 현대적인 랜딩 페이지를...
```

---

### 예시 2: Form

**프롬프트**:
```
"이메일과 비밀번호로 로그인하는 폼. 
'로그인' 버튼과 '비밀번호 찾기' 링크 포함."
```

**자동 감지**: `form`

**생성된 프롬프트**:
```
...
TEMPLATE TYPE: FORM

FORM GUIDELINES:
- Use shadcn/ui Input and Textarea...
- Include proper label and placeholder...
...
```

---

### 예시 3: Card

**프롬프트**:
```
"사용자 프로필 카드. 아바타, 이름, 이메일, 팔로워 수 표시"
```

**자동 감지**: `card`

**생성된 프롬프트**:
```
...
TEMPLATE TYPE: CARD

CARD GUIDELINES:
- Use shadcn/ui Card component...
- Keep content concise...
...
```

---

### 예시 4: 명시적 템플릿 지정

```typescript
// API 호출
fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "간단한 버튼",
    template: "general"  // ← 명시적 지정
  })
});
```

---

## 🎯 리팩터링 전후 비교

### Before (기존)

```typescript
// app/api/generate/route.ts
const SYSTEM_PROMPT = `You are a React...`;  // 하드코딩

function buildUserPrompt(prompt, style, retryReason) {
  return `Design System: ${style}\n${prompt}`;  // 단순
}

// API 호출
const result = await callV0API(apiKey, userPrompt, retryReason);
```

**문제점**:
- ❌ 하드코딩된 프롬프트
- ❌ tokens 변경 시 수동 수정 필요
- ❌ 템플릿 시스템 없음
- ❌ 일관성 부족

---

### After (리팩터링)

```typescript
// lib/prompt-templates.ts
export function buildWhitelistString(tokens) { ... }
export function buildSystemPrompt(tokens) { ... }
export function buildUserPrompt(prompt, tokens, template, retryReason) { ... }
export function detectTemplateType(prompt) { ... }

// app/api/generate/route.ts
import {
  buildSystemPrompt,
  buildUserPrompt,
  detectTemplateType
} from "@/lib/prompt-templates";

const templateType = template || detectTemplateType(prompt);
const systemPrompt = buildSystemPrompt(tokens);
const userPrompt = buildUserPrompt(prompt, tokens, templateType, retryReason);

const result = await callV0API(apiKey, systemPrompt, userPrompt);
```

**개선점**:
- ✅ 모듈화 및 재사용 가능
- ✅ tokens 기반 자동 화이트리스트
- ✅ 3가지 템플릿 시스템
- ✅ 자동 템플릿 감지
- ✅ 일관된 프롬프트 구조

---

## 🧪 테스트 시나리오

### 1. Landing Page 감지

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "현대적인 랜딩 페이지 만들어줘"
  }'
```

**예상 결과**:
```json
{
  "id": "...",
  "template": "landing",
  "status": "completed"
}
```

---

### 2. Form 감지

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "로그인 폼 컴포넌트"
  }'
```

**예상 결과**:
```json
{
  "template": "form"
}
```

---

### 3. 명시적 템플릿

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "버튼 컴포넌트",
    "template": "general"
  }'
```

---

## ✅ 요구사항 체크리스트

- [x] **lib/prompt-templates.ts**: 생성 및 구현
- [x] **buildWhitelistString(tokens)**: tokens 기반 화이트리스트 생성
- [x] **buildSystemPrompt(tokens)**: SYSTEM_PROMPT 생성
- [x] **buildUserPrompt(prompt, tokens, template, retryReason)**: USER_PROMPT 생성
- [x] **3가지 템플릿**: landing, form, card 구현
- [x] **자동 감지**: detectTemplateType() 구현
- [x] **/api/generate 리팩터링**: prompt-templates 사용
- [x] **응답에 template 포함**: API 응답 개선

---

## 📁 파일 구조

```
/Users/skim15/dev/QDS-Design-auto/
├── lib/
│   └── prompt-templates.ts              # ✅ 신규 (320 lines)
│       ├── buildWhitelistString()
│       ├── buildSystemPrompt()
│       ├── buildUserPrompt()
│       ├── detectTemplateType()
│       ├── getStylePresetContext()
│       └── TEMPLATE_GUIDELINES
├── app/
│   └── api/
│       └── generate/
│           └── route.ts                 # ✅ 리팩터링
│               ├── import prompt-templates
│               ├── 템플릿 자동 감지
│               └── 응답에 template 포함
└── PROMPT_TEMPLATES_IMPLEMENTATION.md   # ✅ 이 파일
```

---

## 🎉 완료!

일관된 프롬프트 템플릿 시스템이 완성되었습니다!

### 주요 특징
- ✅ **모듈화**: 재사용 가능한 유틸리티
- ✅ **자동화**: tokens 기반 화이트리스트 자동 생성
- ✅ **템플릿 시스템**: 3가지 템플릿 (landing, form, card)
- ✅ **자동 감지**: 프롬프트 키워드 기반 템플릿 감지
- ✅ **확장성**: 새로운 템플릿 추가 용이
- ✅ **일관성**: 모든 프롬프트에 일관된 구조 적용

### 다음 단계 (선택사항)
- [ ] 더 많은 템플릿 추가 (dashboard, table, chart 등)
- [ ] 다국어 지원 (영어/한국어 템플릿)
- [ ] 템플릿 커스터마이징 UI
- [ ] A/B 테스트용 프롬프트 변형

**즐거운 코딩 되세요!** 🚀





