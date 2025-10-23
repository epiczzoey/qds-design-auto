/**
 * UI Theme 헬퍼
 * shadcn/ui 컴포넌트에서 사용할 theme variant 기본값 제공
 * tokens.json의 디자인 토큰과 매핑
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn 유틸리티 (재사용)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Button Variant Theme
 * tokens.json의 colors를 기반으로 variant 스타일 정의
 */
export const buttonTheme = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
} as const;

/**
 * Card Theme
 * 카드 컴포넌트의 기본 스타일
 */
export const cardTheme = {
  base: "rounded-lg border bg-card text-card-foreground shadow-sm",
  header: "flex flex-col space-y-1.5 p-6",
  title: "text-2xl font-semibold leading-none tracking-tight",
  description: "text-sm text-muted-foreground",
  content: "p-6 pt-0",
  footer: "flex items-center p-6 pt-0",
} as const;

/**
 * Input Theme
 * 입력 필드의 기본 스타일
 */
export const inputTheme = {
  base: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  disabled: "disabled:cursor-not-allowed disabled:opacity-50",
  placeholder: "placeholder:text-muted-foreground",
} as const;

/**
 * Textarea Theme
 */
export const textareaTheme = {
  base: "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  disabled: "disabled:cursor-not-allowed disabled:opacity-50",
  placeholder: "placeholder:text-muted-foreground",
} as const;

/**
 * Select Theme
 */
export const selectTheme = {
  trigger: "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
  focus: "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  disabled: "disabled:cursor-not-allowed disabled:opacity-50",
  content: "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
} as const;

/**
 * Toast Theme
 */
export const toastTheme = {
  variant: {
    default: "border bg-background text-foreground",
    destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
  },
} as const;

/**
 * Badge Theme
 */
export const badgeTheme = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
  },
} as const;

/**
 * Alert Theme
 */
export const alertTheme = {
  variant: {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  },
} as const;

/**
 * Dialog/Modal Theme
 */
export const dialogTheme = {
  overlay: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
  content: "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg duration-200",
  header: "flex flex-col space-y-1.5 text-center sm:text-left",
  title: "text-lg font-semibold leading-none tracking-tight",
  description: "text-sm text-muted-foreground",
  footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
} as const;

/**
 * Skeleton Theme
 */
export const skeletonTheme = {
  base: "animate-pulse rounded-md bg-muted",
} as const;

/**
 * Avatar Theme
 */
export const avatarTheme = {
  base: "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
  image: "aspect-square h-full w-full",
  fallback: "flex h-full w-full items-center justify-center rounded-full bg-muted",
} as const;

/**
 * Separator Theme
 */
export const separatorTheme = {
  base: "shrink-0 bg-border",
  horizontal: "h-[1px] w-full",
  vertical: "h-full w-[1px]",
} as const;

/**
 * 헬퍼: 특정 variant 클래스 가져오기
 */
export function getButtonClasses(variant: keyof typeof buttonTheme.variant = "default", size: keyof typeof buttonTheme.size = "default") {
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    buttonTheme.variant[variant],
    buttonTheme.size[size]
  );
}

export function getInputClasses() {
  return cn(
    inputTheme.base,
    inputTheme.focus,
    inputTheme.disabled,
    inputTheme.placeholder
  );
}

export function getTextareaClasses() {
  return cn(
    textareaTheme.base,
    textareaTheme.focus,
    textareaTheme.disabled,
    textareaTheme.placeholder
  );
}

/**
 * 색상 유틸리티
 * tokens.json의 색상을 JavaScript에서 접근
 */
export const colors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: "hsl(var(--card))",
  cardForeground: "hsl(var(--card-foreground))",
  popover: "hsl(var(--popover))",
  popoverForeground: "hsl(var(--popover-foreground))",
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  secondaryForeground: "hsl(var(--secondary-foreground))",
  muted: "hsl(var(--muted))",
  mutedForeground: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  accentForeground: "hsl(var(--accent-foreground))",
  destructive: "hsl(var(--destructive))",
  destructiveForeground: "hsl(var(--destructive-foreground))",
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
} as const;

/**
 * spacing 유틸리티
 */
export const spacing = {
  xs: "var(--spacing-xs)",
  sm: "var(--spacing-sm)",
  md: "var(--spacing-md)",
  lg: "var(--spacing-lg)",
  xl: "var(--spacing-xl)",
  "2xl": "var(--spacing-2xl)",
  "3xl": "var(--spacing-3xl)",
  "4xl": "var(--spacing-4xl)",
} as const;

/**
 * radius 유틸리티
 */
export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
} as const;

