/**
 * 프롬프트 템플릿 시스템
 * 
 * 기능:
 * - 일관된 프롬프트 구성
 * - tokens.json 기반 화이트리스트 생성
 * - 3가지 템플릿: landing, form, card
 */

import tokens from "@/tokens.json";

export type TemplateType = "landing" | "form" | "card" | "general";

/**
 * SYSTEM_PROMPT 생성 (최적화: 50% 토큰 감소)
 */
export function buildSystemPrompt(designTokens: typeof tokens): string {
  const { colors, radius, spacing } = designTokens;
  
  // 핵심 색상만 추출 (8개)
  const coreColors = ['bg', 'fg', 'primary', 'secondary', 'muted', 'accent', 'destructive', 'border']
    .map(key => `${key}="${colors[key as keyof typeof colors]}"`)
    .join(' ');

  return `You are a React component generator. Create modern, beautiful UI components.

RULES:
1. Output format: "export default function ComponentName() {...}"
2. Use plain JavaScript (NO TypeScript types like : Type)
3. NO import statements - hooks already available: useState, useEffect, useRef, useCallback, useMemo
4. NO external images/URLs - use Tailwind bg-* or placeholder colors
5. NO fetch/axios/network requests
6. Use semantic HTML + ARIA for accessibility

DESIGN TOKENS:
Colors: ${coreColors}
Radius: ${Object.keys(radius).join(', ')}
Spacing: ${Object.keys(spacing).slice(0, 6).join(', ')}

TAILWIND CLASSES:
- Colors: bg-{color}, text-{color}, border-{color}
- Layout: flex, grid, relative, absolute
- Spacing: p-*, m-*, gap-*, space-*
- Sizing: w-full, h-screen, max-w-*
- Effects: hover:*, transition-*, opacity-*, scale-*
- Standard utilities available

OUTPUT:
Return ONLY the code. NO markdown, NO explanations, NO \`\`\` blocks.`;
}

/**
 * User Prompt 생성 (최적화: 70% 토큰 감소)
 * 
 * @param prompt - 사용자 입력 프롬프트
 * @param designTokens - tokens.json
 * @param template - 템플릿 타입 (landing, form, card, general)
 * @param retryReason - 재시도 사유 (선택)
 */
export function buildUserPrompt(
  prompt: string,
  designTokens: typeof tokens,
  template: TemplateType = "general",
  retryReason?: string
): string {
  // 템플릿별 간단한 힌트
  const templateHints: Record<TemplateType, string> = {
    landing: "Create full-page hero with CTA, features, testimonials.",
    form: "Style inputs with bg-input, border-border, rounded-md. Include validation.",
    card: "Use bg-muted, border, rounded-lg, shadow-md. Add hover effects.",
    general: "Modern, responsive UI with design tokens.",
  };

  let userPrompt = `TEMPLATE: ${template.toUpperCase()}
HINT: ${templateHints[template]}

USER REQUEST:
${prompt}

REQUIREMENTS:
- Use design tokens colors (bg, fg, primary, muted, etc.)
- Responsive + accessible
- Smooth transitions
- NO external resources`;

  // 재시도 사유 추가
  if (retryReason) {
    userPrompt += `\n\n⚠️ FIX REQUIRED: ${retryReason}`;
  }

  return userPrompt;
}

/**
 * 프롬프트에서 템플릿 타입 자동 감지
 */
export function detectTemplateType(prompt: string): TemplateType {
  const lowerPrompt = prompt.toLowerCase();

  // Landing page 키워드
  if (
    lowerPrompt.includes("landing") ||
    lowerPrompt.includes("hero") ||
    lowerPrompt.includes("홈페이지") ||
    lowerPrompt.includes("메인 페이지") ||
    lowerPrompt.includes("랜딩")
  ) {
    return "landing";
  }

  // Form 키워드
  if (
    lowerPrompt.includes("form") ||
    lowerPrompt.includes("login") ||
    lowerPrompt.includes("signup") ||
    lowerPrompt.includes("register") ||
    lowerPrompt.includes("input") ||
    lowerPrompt.includes("폼") ||
    lowerPrompt.includes("로그인") ||
    lowerPrompt.includes("회원가입") ||
    lowerPrompt.includes("입력")
  ) {
    return "form";
  }

  // Card 키워드
  if (
    lowerPrompt.includes("card") ||
    lowerPrompt.includes("profile") ||
    lowerPrompt.includes("product") ||
    lowerPrompt.includes("카드") ||
    lowerPrompt.includes("프로필") ||
    lowerPrompt.includes("상품")
  ) {
    return "card";
  }

  // 기본값
  return "general";
}

/**
 * 스타일 프리셋별 추가 컨텍스트
 */
export function getStylePresetContext(style: string): string {
  const presets: Record<string, string> = {
    default: "Dark theme with modern, minimalist aesthetics",
    light: "Light theme with clean, bright aesthetics",
    modern: "Modern theme with bold colors and strong contrasts",
  };

  return presets[style] || presets.default;
}

