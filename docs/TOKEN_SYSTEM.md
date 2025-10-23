# 디자인 토큰 시스템 가이드

## 개요

`tokens.json`을 단일 소스로 사용하여 Tailwind CSS 설정과 UI 컴포넌트 테마를 자동으로 동기화하는 시스템입니다.

## 파일 구조

```
프로젝트 루트/
├── tokens.json                    # 디자인 토큰 정의 (Single Source of Truth)
├── tailwind.config.ts             # 자동 생성됨 (tokens.json → 동기화)
├── app/globals.css                # CSS 변수 (자동 업데이트)
├── lib/
│   └── ui-theme.ts               # shadcn/ui 테마 헬퍼
├── scripts/
│   └── sync-tokens.ts            # 동기화 스크립트
└── examples/
    └── ui-theme-usage.tsx        # 사용 예시
```

---

## 1. tokens.json 구조

### 전체 스키마

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "version": "1.0.0",
  "theme": "dark",
  "colors": { ... },
  "radius": { ... },
  "spacing": { ... },
  "shadow": { ... },
  "font": { ... },
  "text": { ... }
}
```

### 색상 (colors)

```json
{
  "colors": {
    "background": "#0B0B0C",      // 배경색
    "foreground": "#F3F4F6",      // 텍스트색
    "primary": "#2563EB",         // Primary 액션
    "primary-foreground": "#FFFFFF",
    "secondary": "#64748B",       // Secondary 액션
    "muted": "#1F2937",           // 비활성/배경
    "destructive": "#EF4444",     // 삭제/경고
    "border": "#374151",          // 테두리
    "input": "#374151",           // 입력 필드
    "ring": "#2563EB"             // Focus ring
  }
}
```

### 반경 (radius)

```json
{
  "radius": {
    "sm": "0.375rem",   // 6px
    "md": "0.5rem",     // 8px
    "lg": "0.75rem",    // 12px
    "xl": "1rem",       // 16px
    "2xl": "1.5rem"     // 24px
  }
}
```

### 간격 (spacing)

```json
{
  "spacing": {
    "xs": "0.25rem",    // 4px
    "sm": "0.5rem",     // 8px
    "md": "0.75rem",    // 12px
    "lg": "1rem",       // 16px
    "xl": "1.5rem",     // 24px
    "2xl": "2rem",      // 32px
    "3xl": "3rem",      // 48px
    "4xl": "4rem"       // 64px
  }
}
```

### 그림자 (shadow)

```json
{
  "shadow": {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)"
  }
}
```

### 폰트 (font)

```json
{
  "font": {
    "sans": "Inter, Pretendard, ui-sans-serif, system-ui, sans-serif",
    "mono": "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
  }
}
```

### 텍스트 크기 (text)

```json
{
  "text": {
    "xs": ["0.75rem", { "lineHeight": "1rem" }],
    "sm": ["0.875rem", { "lineHeight": "1.25rem" }],
    "base": ["1rem", { "lineHeight": "1.5rem" }],
    "lg": ["1.125rem", { "lineHeight": "1.75rem" }],
    "xl": ["1.25rem", { "lineHeight": "1.75rem" }],
    "2xl": ["1.5rem", { "lineHeight": "2rem" }],
    "3xl": ["1.875rem", { "lineHeight": "2.25rem" }],
    "4xl": ["2.25rem", { "lineHeight": "2.5rem" }]
  }
}
```

---

## 2. 동기화 워크플로우

### 자동 동기화 실행

```bash
# tokens.json 수정 후 실행
pnpm tokens:sync
```

### 실행 결과

1. ✅ `tailwind.config.ts` 업데이트
   - `theme.extend.colors` ← tokens.colors
   - `theme.extend.borderRadius` ← tokens.radius
   - `theme.extend.spacing` ← tokens.spacing
   - `theme.extend.boxShadow` ← tokens.shadow
   - `theme.extend.fontFamily` ← tokens.font
   - `theme.extend.fontSize` ← tokens.text

2. ✅ `app/globals.css` 업데이트
   - `:root` CSS 변수 생성

3. 🔄 개발 서버 재시작 필요
   ```bash
   pnpm dev
   ```

### Idempotent (멱등성)

- 동일한 `tokens.json`으로 여러 번 실행해도 결과는 항상 동일
- 기존 설정을 안전하게 덮어씀
- Git diff로 변경사항 확인 가능

---

## 3. UI 테마 헬퍼 사용법

### 기본 import

```typescript
import { 
  getButtonClasses,
  getInputClasses,
  buttonTheme,
  cardTheme,
  colors,
  spacing,
  radius,
  cn 
} from "@/lib/ui-theme";
```

### Button 컴포넌트

```tsx
// 기본 사용
<button className={getButtonClasses("default", "default")}>
  Primary Button
</button>

// Variant 변경
<button className={getButtonClasses("destructive", "lg")}>
  Delete
</button>

// 커스텀 클래스 추가
<button className={cn(
  getButtonClasses("outline"),
  "w-full"
)}>
  Full Width
</button>
```

### Card 컴포넌트

```tsx
<div className={cardTheme.base}>
  <div className={cardTheme.header}>
    <h3 className={cardTheme.title}>제목</h3>
    <p className={cardTheme.description}>설명</p>
  </div>
  <div className={cardTheme.content}>
    콘텐츠
  </div>
  <div className={cardTheme.footer}>
    <button className={getButtonClasses()}>Action</button>
  </div>
</div>
```

### Input 컴포넌트

```tsx
<input
  type="text"
  placeholder="입력..."
  className={getInputClasses()}
/>
```

### 색상 직접 사용

```tsx
// Tailwind 클래스
<div className="bg-primary text-primary-foreground">
  Primary Box
</div>

// Inline styles
<div style={{ 
  backgroundColor: colors.primary,
  color: colors.primaryForeground,
  padding: spacing.lg,
  borderRadius: radius.md,
}}>
  Inline Style Box
</div>
```

### cn 유틸리티

```tsx
// 조건부 클래스
<div className={cn(
  "base-class",
  isActive && "active-class",
  "another-class"
)}>
  Content
</div>
```

---

## 4. 토큰 변경 워크플로우

### 시나리오 1: 색상 변경

```bash
# 1. tokens.json 수정
{
  "colors": {
    "primary": "#3B82F6"  // 변경
  }
}

# 2. 동기화
pnpm tokens:sync

# 3. 서버 재시작
pnpm dev

# ✅ 모든 primary 색상이 자동으로 업데이트됨
```

### 시나리오 2: 새 색상 추가

```bash
# 1. tokens.json에 추가
{
  "colors": {
    "success": "#10B981",
    "success-foreground": "#FFFFFF"
  }
}

# 2. 동기화
pnpm tokens:sync

# 3. 사용
<div className="bg-success text-success-foreground">
  Success!
</div>
```

### 시나리오 3: 간격(spacing) 조정

```bash
# 1. tokens.json 수정
{
  "spacing": {
    "xl": "2rem"  // 1.5rem → 2rem
  }
}

# 2. 동기화
pnpm tokens:sync

# 3. 자동 적용
<div className="p-xl">  {/* 이제 32px */}
  Content
</div>
```

---

## 5. 베스트 프랙티스

### ✅ DO

1. **tokens.json만 수정**
   - 모든 디자인 토큰은 `tokens.json`에서 관리
   - `tailwind.config.ts`는 자동 생성 파일로 취급

2. **동기화 후 커밋**
   ```bash
   pnpm tokens:sync
   git add tokens.json tailwind.config.ts app/globals.css
   git commit -m "chore: update design tokens"
   ```

3. **UI 테마 헬퍼 사용**
   - 직접 Tailwind 클래스 대신 `lib/ui-theme.ts` 사용
   - 일관성 유지 및 유지보수 용이

4. **버전 관리**
   - `tokens.json`의 `version` 필드 업데이트
   - Breaking changes 시 메이저 버전 증가

### ❌ DON'T

1. **tailwind.config.ts 직접 수정 금지**
   - 동기화 시 덮어씌워짐
   - 커스텀 설정은 별도 파일로 분리

2. **하드코딩된 색상 사용 금지**
   ```tsx
   // ❌ BAD
   <div className="bg-[#2563EB]">Bad</div>
   
   // ✅ GOOD
   <div className="bg-primary">Good</div>
   ```

3. **동기화 없이 tokens.json만 수정 금지**
   - 항상 `pnpm tokens:sync` 실행 필수

---

## 6. 트러블슈팅

### 문제: 토큰 변경이 적용 안 됨

```bash
# 해결 1: 동기화 재실행
pnpm tokens:sync

# 해결 2: 캐시 클리어 후 재시작
rm -rf .next
pnpm dev

# 해결 3: node_modules 재설치
rm -rf node_modules .next
pnpm install
pnpm dev
```

### 문제: TypeScript 에러

```bash
# tsx 설치 확인
pnpm add -D tsx

# tsconfig.json 확인
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 문제: Tailwind 클래스가 작동 안 함

1. `tailwind.config.ts`의 `content` 경로 확인
2. 동기화 실행: `pnpm tokens:sync`
3. 서버 재시작: `pnpm dev`

---

## 7. 향후 확장 계획

### Figma Variables API 연동

```typescript
// scripts/sync-from-figma.ts (TODO)
// 1. Figma API로 Variables 가져오기
// 2. tokens.json 형식으로 변환
// 3. pnpm tokens:sync 자동 실행
```

### Light 테마 지원

```json
{
  "theme": "dark",
  "themes": {
    "light": { ... },
    "dark": { ... }
  }
}
```

### 토큰 검증

```bash
# scripts/validate-tokens.ts (TODO)
pnpm tokens:validate
```

---

## 8. 참고 자료

- [Tailwind CSS Theme Configuration](https://tailwindcss.com/docs/theme)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)

---

## 변경 이력

- **v1.0.0** (2025-01-17)
  - 초기 토큰 시스템 구축
  - 자동 동기화 스크립트
  - UI 테마 헬퍼

