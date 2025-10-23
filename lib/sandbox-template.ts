/**
 * Sandbox Template Builder
 * iframe srcDoc에 주입될 HTML 템플릿을 생성합니다.
 * 로컬 UMD 스크립트만 사용하며, CSP로 외부 리소스를 차단합니다.
 */

import tokens from "@/tokens.json";

/**
 * TypeScript 코드를 정규화 (세미콜론 추가, 타입 정리)
 * Babel Standalone이 파싱할 수 있도록 코드를 정리합니다.
 * @param code - 원본 코드
 * @returns 정규화된 코드
 */
function normalizeCode(code: string): string {
  let normalized = code;

  // 0. import 문 제거 (iframe에서는 모듈 시스템 사용 불가)
  // import { ... } from "..." 형태 모두 제거
  // DB에 저장된 이전 코드에도 import가 있을 수 있으므로 항상 제거
  normalized = normalized.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  normalized = normalized.replace(/^import\s+['"].*?['"];?\s*$/gm, '');
  
  // import 문 제거 후 상단 빈 줄 정리
  normalized = normalized.replace(/^\s*\n+/, '');

  // 0-1. TypeScript 타입 어노테이션 제거 (Babel Standalone의 불완전한 TS 지원)
  
  // 함수 파라미터: (param: Type) => (param)
  // 일반 함수 파라미터 및 화살표 함수 파라미터 모두 처리
  // 주의: 삼항 연산자(? :)와 구분 필요
  normalized = normalized.replace(
    /\(([a-zA-Z_$][\w$]*)\s*:\s*([a-zA-Z_$][\w$<>[\]|&\s]*)\)/g,
    (match, paramName, typeName) => {
      // 타입 이름이 대문자로 시작하거나 일반적인 TS 타입이면 제거
      const isType = /^[A-Z]/.test(typeName) || 
                     ['string', 'number', 'boolean', 'any', 'void', 'unknown', 'never', 'object'].includes(typeName.trim());
      if (isType) {
        return `(${paramName})`;
      }
      return match; // 타입이 아니면 그대로 유지 (삼항 연산자 보호)
    }
  );
  
  // 단일 파라미터 화살표 함수 (괄호 없음): param: Type => => param =>
  // 예: const handleClick = (item: Product) => {} 의 경우 위에서 처리되지만
  // 예: const handleClick = item: Product => {} 같은 경우도 처리
  normalized = normalized.replace(
    /\b([a-zA-Z_$][\w$]*)\s*:\s*([A-Z][\w<>[\]|&\s]*)\s*=>/g,
    (match, paramName, typeName) => {
      // 타입 이름이 대문자로 시작하면 제거
      const isType = /^[A-Z]/.test(typeName);
      if (isType) {
        return `${paramName} =>`;
      }
      return match; // 삼항 연산자 보호
    }
  );
  
  // 변수 선언: const x: Type = => const x =
  // 주의: 삼항 연산자와 구분하기 위해 타입명 패턴 제한
  normalized = normalized.replace(
    /\b(const|let|var)\s+(\w+)\s*:\s*([A-Z][\w<>[\]|&\s]*)\s*=/g,
    '$1 $2 ='
  );
  
  // 배열/객체 타입 선언도 제거: const items: Item[] = => const items =
  normalized = normalized.replace(
    /\b(const|let|var)\s+(\w+)\s*:\s*([A-Z][\w<>[\]|&\s]+\[\])\s*=/g,
    '$1 $2 ='
  );

  // 1. interface/type 정의 블록 내부의 필드에만 세미콜론 추가
  // 객체 리터럴과 구분하기 위해 더 정확한 패턴 사용
  normalized = normalized.replace(
    /(interface|type)\s+(\w+)\s*(\{[^}]*\})/g,
    (match, keyword, name, body) => {
      // interface/type 블록 내부에서만 세미콜론 추가
      const fixedBody = body.replace(
        /(\w+\??\s*:\s*[^;\n,{}]+)(\n)/g,
        (fieldMatch, field, newline) => {
          const trimmed = field.trim();
          
          // 이미 세미콜론이나 쉼표가 있으면 그대로
          if (trimmed.endsWith(';') || trimmed.endsWith(',')) {
            return fieldMatch;
          }
          
          // {, }, [, ], (, )로 끝나면 그대로
          if (/[{}\[\]()]$/.test(trimmed)) {
            return fieldMatch;
          }
          
          // =, >, <로 끝나면 그대로
          if (/[=><]$/.test(trimmed)) {
            return fieldMatch;
          }
          
          return `${field};${newline}`;
        }
      );
      
      return `${keyword} ${name} ${fixedBody}`;
    }
  );

  // 2. 중괄호 앞의 불필요한 세미콜론 제거
  // interface Product {; → interface Product {
  normalized = normalized.replace(/;\s*(\{)/g, ' $1');

  // 3. 중괄호 내부에서 중복 세미콜론 제거
  // name: string;; → name: string;
  normalized = normalized.replace(/;+\s*;+/g, ';');

  // 4. 쉼표+세미콜론 조합 제거 (객체 리터럴 오류 수정)
  // id: 1,; → id: 1,
  normalized = normalized.replace(/,\s*;/g, ',');

  // 5. type alias에서 세미콜론 누락 수정
  // type Name = string → type Name = string;
  normalized = normalized.replace(
    /^(\s*type\s+\w+\s*=\s*[^;\n{]+)(\n)/gm,
    (match, typeDef, newline) => {
      if (typeDef.trim().endsWith(';')) {
        return match;
      }
      // type이 { }로 시작하면 제외 (이미 위에서 처리됨)
      if (typeDef.includes('{')) {
        return match;
      }
      return `${typeDef};${newline}`;
    }
  );

  return normalized;
}

/**
 * React 컴포넌트 코드를 iframe에서 실행 가능한 HTML 문서로 변환
 * @param code - React 컴포넌트 코드
 * @returns HTML 문서 문자열
 */
export function buildSrcDoc(code: string): string {
  // 코드 정규화 (세미콜론 자동 추가, import 제거)
  // 참고: DB에 저장된 이전 코드에도 import가 있을 수 있으므로 항상 정규화 필요
  const normalizedCode = normalizeCode(code);
  const { colors, font, radius } = tokens;

  // CSP 헤더: iframe srcDoc 호환 보안 정책
  // - default-src 'none': 기본적으로 모든 리소스 차단
  // - script-src 'self' 'unsafe-inline' 'unsafe-eval': 로컬 스크립트 + 인라인 스크립트 + Babel 트랜스파일 허용
  // - style-src 'self' 'unsafe-inline': 로컬 스타일 + 인라인 스타일 허용
  // - img-src 'self' data: https: http:: 로컬 이미지 + Data URL + 외부 이미지(HTTP/HTTPS) 허용
  // - connect-src 'self': source map 및 개발 도구 연결 허용
  const csp = [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: http:",
    "connect-src 'self'",
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Component Preview</title>
  
  <!-- React UMD (로컬) -->
  <script src="/vendor/react.production.min.js"></script>
  
  <!-- ReactDOM UMD (로컬) -->
  <script src="/vendor/react-dom.production.min.js"></script>
  
  <!-- Babel Standalone for JSX Transpilation (로컬) -->
  <script src="/vendor/babel-standalone.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background-color: ${colors.bg};
      color: ${colors.fg};
      font-family: ${font.sans};
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    /* Design Tokens을 CSS 변수로 정의 */
    :root {
      --color-bg: ${colors.bg};
      --color-fg: ${colors.fg};
      --color-primary: ${colors.primary};
      --color-primary-foreground: ${colors["primary-foreground"]};
      --color-secondary: ${colors.secondary};
      --color-secondary-foreground: ${colors["secondary-foreground"]};
      --color-muted: ${colors.muted};
      --color-muted-foreground: ${colors["muted-foreground"]};
      --color-accent: ${colors.accent};
      --color-accent-foreground: ${colors["accent-foreground"]};
      --color-destructive: ${colors.destructive};
      --color-destructive-foreground: ${colors["destructive-foreground"]};
      --color-border: ${colors.border};
      --color-input: ${colors.input};
      --color-ring: ${colors.ring};
      
      --radius-sm: ${radius.sm};
      --radius-md: ${radius.md};
      --radius-lg: ${radius.lg};
      --radius-xl: ${radius.xl};
      
      --font-sans: ${font.sans};
      --font-mono: ${font.mono};
    }
    
    /* 스크롤바 스타일링 (dark theme) */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: ${colors.muted};
    }
    
    ::-webkit-scrollbar-thumb {
      background: ${colors["muted-foreground"]};
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: ${colors.fg};
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- 사용자 컴포넌트 코드 (Babel로 트랜스파일) -->
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    
    // Design Tokens 객체를 전역으로 제공
    window.tokens = ${JSON.stringify(tokens, null, 2)};
    
    // export default를 함수 선언으로 변환하여 전역에 노출
    const codeWithoutExport = \`${normalizedCode.replace(/`/g, '\\`').replace(/export\s+default\s+function\s+/g, 'window.')}\`;
    
    // 컴포넌트 함수명 추출
    const componentMatch = codeWithoutExport.match(/window\\.([a-zA-Z_$][\\w$]*)/);
    const ComponentName = componentMatch ? componentMatch[1] : null;
    
    try {
      // 코드 실행 (함수를 window에 등록)
      eval(codeWithoutExport);
      
      // 컴포넌트를 DOM에 렌더링
      const container = document.getElementById('root');
      const root = ReactDOM.createRoot(container);
      
      if (ComponentName && typeof window[ComponentName] === 'function') {
        root.render(React.createElement(window[ComponentName]));
      } else {
        throw new Error('Component not found. Make sure to export default function ComponentName()');
      }
      
      // 에러 핸들링
      window.addEventListener('error', (event) => {
        console.error('Sandbox error:', event.error);
        root.render(
          React.createElement('div', 
            { 
              style: { 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                backgroundColor: '${colors.bg}',
                color: '${colors.destructive}'
              }
            },
            React.createElement('div', 
              { 
                style: { 
                  backgroundColor: '${colors.muted}',
                  border: '2px solid ${colors.destructive}',
                  borderRadius: '${radius.lg}',
                  padding: '2rem',
                  maxWidth: '48rem'
                }
              },
              React.createElement('h2', 
                { style: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '${colors.destructive}' } }, 
                '🔴 런타임 오류'
              ),
              React.createElement('pre', 
                { style: { fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '${colors.fg}' } }, 
                event.error?.message || '알 수 없는 오류가 발생했습니다.'
              )
            )
          )
        );
      });
    } catch (error) {
      console.error('Component initialization error:', error);
      const container = document.getElementById('root');
      const root = ReactDOM.createRoot(container);
      root.render(
        React.createElement('div', 
          { 
            className: 'min-h-screen flex items-center justify-center',
            style: { 
              backgroundColor: '${colors.destructive}',
              color: '${colors["destructive-foreground"]}',
              padding: '2rem'
            }
          },
          React.createElement('div', null, 
            React.createElement('h2', { style: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' } }, 
              '⚠️ 컴포넌트 초기화 실패'
            ),
            React.createElement('pre', { style: { fontSize: '0.875rem', whiteSpace: 'pre-wrap' } }, 
              error.message || 'export default function ComponentName() 형식으로 컴포넌트를 내보내주세요.'
            )
          )
        )
      );
    }
  </script>
</body>
</html>`;
}

/**
 * 에러 상태를 표시하는 HTML 문서 생성
 * @param error - 에러 메시지
 * @returns 에러 표시 HTML 문서
 */
export function buildErrorSrcDoc(error: string): string {
  const { colors, font, radius } = tokens;

  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "connect-src 'self'",
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Error</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: ${colors.bg};
      color: ${colors.fg};
      font-family: ${font.sans};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .error-container {
      background-color: ${colors.muted};
      border: 2px solid ${colors.destructive};
      border-radius: ${radius.lg};
      padding: 2rem;
      max-width: 48rem;
      width: 100%;
    }
    h2 {
      color: ${colors.destructive};
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    pre {
      color: ${colors.fg};
      background-color: ${colors.bg};
      padding: 1rem;
      border-radius: ${radius.md};
      border: 1px solid ${colors.border};
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-x: auto;
      font-family: ${font.mono};
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h2>⚠️ 프리뷰 오류</h2>
    <pre>${error.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  </div>
</body>
</html>`;
}

