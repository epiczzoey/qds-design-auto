/**
 * UI Theme 사용 예시
 * lib/ui-theme.ts의 테마 헬퍼 사용 방법
 */

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

/**
 * 예시 1: Button 컴포넌트에서 theme 사용
 */
export function ThemedButton() {
  return (
    <>
      {/* 기본 버튼 */}
      <button className={getButtonClasses("default", "default")}>
        Primary Button
      </button>

      {/* Destructive 버튼 */}
      <button className={getButtonClasses("destructive", "lg")}>
        Delete
      </button>

      {/* Ghost 버튼 */}
      <button className={getButtonClasses("ghost", "sm")}>
        Cancel
      </button>

      {/* 커스텀 조합 */}
      <button className={cn(
        getButtonClasses("outline"),
        "w-full" // 추가 클래스
      )}>
        Full Width Outline
      </button>
    </>
  );
}

/**
 * 예시 2: Card 컴포넌트에서 theme 사용
 */
export function ThemedCard() {
  return (
    <div className={cardTheme.base}>
      <div className={cardTheme.header}>
        <h3 className={cardTheme.title}>Card Title</h3>
        <p className={cardTheme.description}>Card description</p>
      </div>
      <div className={cardTheme.content}>
        <p>Card content goes here.</p>
      </div>
      <div className={cardTheme.footer}>
        <button className={getButtonClasses()}>Action</button>
      </div>
    </div>
  );
}

/**
 * 예시 3: Input 컴포넌트에서 theme 사용
 */
export function ThemedInput() {
  return (
    <input
      type="text"
      placeholder="Enter text..."
      className={getInputClasses()}
    />
  );
}

/**
 * 예시 4: 색상 값 직접 사용 (inline styles)
 */
export function ColorExample() {
  return (
    <div style={{ 
      backgroundColor: colors.primary,
      color: colors.primaryForeground,
      padding: spacing.lg,
      borderRadius: radius.md,
    }}>
      Primary Color Box
    </div>
  );
}

/**
 * 예시 5: Custom 컴포넌트에 theme 적용
 */
export function CustomThemedComponent() {
  return (
    <div className={cn(
      // base styles
      "rounded-lg p-6",
      // theme colors
      "bg-card text-card-foreground",
      "border border-border",
      "shadow-md"
    )}>
      <h2 className="text-2xl font-bold mb-4 text-foreground">
        Custom Component
      </h2>
      <p className="text-muted-foreground mb-4">
        This component uses tokens.json design tokens.
      </p>
      <div className="flex gap-2">
        <button className={buttonTheme.variant.default + " " + buttonTheme.size.default}>
          Primary
        </button>
        <button className={buttonTheme.variant.secondary + " " + buttonTheme.size.default}>
          Secondary
        </button>
      </div>
    </div>
  );
}

/**
 * 예시 6: 반응형 디자인과 theme 조합
 */
export function ResponsiveThemedComponent() {
  return (
    <div className={cn(
      cardTheme.base,
      "p-4 md:p-6 lg:p-8", // responsive padding
      "max-w-sm md:max-w-md lg:max-w-lg" // responsive width
    )}>
      <h3 className={cn(
        cardTheme.title,
        "text-lg md:text-xl lg:text-2xl" // responsive text
      )}>
        Responsive Card
      </h3>
      <p className={cardTheme.description}>
        This card adapts to different screen sizes.
      </p>
    </div>
  );
}

/**
 * 예시 7: Dark 테마 토큰 활용
 * tokens.json의 dark theme 색상이 자동으로 적용됨
 */
export function DarkThemedComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold">Dark Theme Example</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="grid gap-4">
          <div className={cn(
            cardTheme.base,
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors cursor-pointer"
          )}>
            <div className={cardTheme.header}>
              <h2 className={cardTheme.title}>Feature 1</h2>
              <p className={cardTheme.description}>Description here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

