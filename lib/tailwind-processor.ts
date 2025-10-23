/**
 * Tailwind CSS 처리 (CDN 방식)
 * 
 * 서버 사이드 PostCSS 처리는 Next.js 런타임 환경에서 복잡하므로
 * 클라이언트 사이드 Tailwind CDN을 사용합니다.
 */

/**
 * 더미 함수: CSS 생성 (실제로는 CDN 사용)
 * @param code - React 컴포넌트 코드
 * @returns 빈 문자열 (CDN이 처리함)
 */
export async function generateTailwindCSS(code: string): Promise<string> {
  // CDN 방식을 사용하므로 서버에서 CSS 생성하지 않음
  return "";
}

/**
 * CSS 최적화 및 압축
 * @param css - 원본 CSS
 * @returns 최적화된 CSS
 */
export function optimizeCSS(css: string): string {
  // 불필요한 공백 제거
  let optimized = css
    .replace(/\/\*[\s\S]*?\*\//g, "") // 주석 제거
    .replace(/\s+/g, " ") // 여러 공백을 하나로
    .replace(/\s*([{}:;,])\s*/g, "$1") // 특수문자 주변 공백 제거
    .trim();

  return optimized;
}

/**
 * CSS 크기 계산 (KB)
 * @param css - CSS 문자열
 * @returns KB 단위 크기
 */
export function calculateCSSSize(css: string): number {
  return new Blob([css]).size / 1024;
}

