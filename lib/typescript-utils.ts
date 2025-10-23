/**
 * TypeScript 타입 제거 유틸리티
 * 간단한 정규식 기반으로 TypeScript 타입 어노테이션을 제거하여 JavaScript로 변환합니다.
 */

/**
 * TypeScript 코드에서 타입 어노테이션을 제거하여 순수 JavaScript로 변환
 * @param code - TypeScript 코드
 * @returns 타입이 제거된 JavaScript 코드
 */
export function removeTypeScript(code: string): string {
  let cleaned = code;

  // 1. import 문 제거 (동적 렌더링에서는 사용 불가)
  cleaned = cleaned.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  cleaned = cleaned.replace(/^import\s+['"].*?['"];?\s*$/gm, '');

  // 2. export default 제거 (함수는 유지)
  cleaned = cleaned.replace(/export\s+default\s+/g, '');

  // 3. interface 정의 완전히 제거 (중괄호 중첩 고려)
  cleaned = cleaned.replace(/interface\s+\w+\s*\{[\s\S]*?\}\s*/g, '');
  
  // 4. type 정의 완전히 제거 (중괄호가 있는 경우와 없는 경우 모두)
  cleaned = cleaned.replace(/type\s+\w+\s*=\s*\{[\s\S]*?\};?\s*/g, '');
  cleaned = cleaned.replace(/type\s+\w+\s*=\s*[^;{]+;?\s*/g, '');

  // 5. 함수 파라미터 타입 제거 (JSX 태그는 보존)
  // 함수 선언 및 화살표 함수의 파라미터만 처리
  cleaned = cleaned.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (match, funcName, params) => {
    if (!params.trim()) return match;
    
    const cleanedParams = params
      .split(',')
      .map((param: string) => {
        // param: Type 형태에서 : Type 제거
        // param: Type = default 형태는 param = default로
        const withoutType = param.replace(/:\s*[^=,)]+(?=\s*[,=)]|$)/, '');
        return withoutType.trim();
      })
      .filter((p: string) => p)
      .join(', ');
    
    return `function ${funcName}(${cleanedParams})`;
  });

  // 화살표 함수 파라미터 처리 - JSX 속성과 구분하기 위해 더 신중하게 처리
  // '() =>'나 '(param) =>' 형태만 매칭
  // 줄 시작이나 =, 공백, 쉼표 뒤에 오는 경우만 처리 (Tailwind 클래스와 구분)
  cleaned = cleaned.replace(/(^|[\s=,])\(([^)]*)\)\s*=>/gm, (match, prefix, params) => {
    if (!params.trim()) return `${prefix}() =>`;
    
    const cleanedParams = params
      .split(',')
      .map((param: string) => {
        const withoutType = param.replace(/:\s*[^=,)]+(?=\s*[,=)]|$)/, '');
        return withoutType.trim();
      })
      .filter((p: string) => p)
      .join(', ');
    
    return `${prefix}(${cleanedParams}) =>`;
  });

  // 6. 변수 선언 타입 제거
  // const x: Type = ... -> const x = ...
  cleaned = cleaned.replace(/\b(const|let|var)\s+(\w+)\s*:\s*[^=]+(?==)/g, '$1 $2');

  // 7. 배열/객체 destructuring 타입 제거
  // const { x, y }: Type = ... -> const { x, y } = ...
  cleaned = cleaned.replace(/\b(const|let|var)\s+(\{[^}]+\}|\[[^\]]+\])\s*:\s*[^=]+(?==)/g, '$1 $2');

  // 8. 함수 반환 타입 제거
  // function name(): Type { -> function name() {
  // ): Type => { -> ) => {
  // ): Type => ... 형태만 매칭하여 JSX 태그 보호
  cleaned = cleaned.replace(/\)\s*:\s*[^\s{=>]+\s*(?=[{=>])/g, ')');

  // 9. as 타입 단언 제거 (JSX는 보존)
  cleaned = cleaned.replace(/\s+as\s+(?!const\b)\w+/g, '');

  // 10. readonly, public, private, protected 제거
  cleaned = cleaned.replace(/\b(readonly|public|private|protected)\s+/g, '');

  // 11. 선택적 파라미터 ? 제거 (필요시)
  // 주의: JSX의 삼항 연산자와 구분 필요
  // cleaned = cleaned.replace(/(\w+)\?\s*:/g, '$1:');

  // 12. 상단 빈 줄 정리
  cleaned = cleaned.replace(/^\s*\n+/, '');

  // 13. 중복 빈 줄 제거 (3개 이상 연속된 빈 줄을 2개로)
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');

  return cleaned.trim();
}

/**
 * 코드에서 기본 export된 컴포넌트 이름 추출
 * @param code - React 컴포넌트 코드
 * @returns 컴포넌트 함수명 또는 null
 */
export function extractComponentName(code: string): string | null {
  // export default function ComponentName 패턴
  const match1 = code.match(/export\s+default\s+function\s+([a-zA-Z_$][\w$]*)/);
  if (match1) return match1[1];

  // function ComponentName (export 제거 후)
  const match2 = code.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(/);
  if (match2) return match2[1];

  // const ComponentName = 패턴
  const match3 = code.match(/(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/);
  if (match3) return match3[1];

  return null;
}

