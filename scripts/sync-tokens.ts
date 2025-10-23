#!/usr/bin/env tsx
/**
 * 디자인 토큰 동기화 스크립트
 * tokens.json을 읽어서 tailwind.config.ts를 자동 업데이트합니다.
 * 
 * 실행: pnpm tokens:sync
 */

import fs from 'fs';
import path from 'path';

interface DesignTokens {
  version: string;
  theme: string;
  colors: Record<string, string>;
  radius: Record<string, string>;
  spacing: Record<string, string>;
  shadow: Record<string, string>;
  font: Record<string, string>;
  text: Record<string, [string, { lineHeight: string }]>;
}

const PROJECT_ROOT = path.join(__dirname, '..');
const TOKENS_PATH = path.join(PROJECT_ROOT, 'tokens.json');
const TAILWIND_CONFIG_PATH = path.join(PROJECT_ROOT, 'tailwind.config.ts');

/**
 * tokens.json 읽기
 */
function readTokens(): DesignTokens {
  try {
    const content = fs.readFileSync(TOKENS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ tokens.json 읽기 실패:', error);
    process.exit(1);
  }
}

/**
 * tailwind.config.ts 업데이트
 * 기존 파일을 읽어서 theme.extend 부분만 교체 (idempotent)
 */
function updateTailwindConfig(tokens: DesignTokens): void {
  try {
    let config = fs.readFileSync(TAILWIND_CONFIG_PATH, 'utf-8');

    // colors 객체 생성
    const colorsCode = Object.entries(tokens.colors)
      .map(([key, value]) => `        "${key}": "${value}",`)
      .join('\n');

    // borderRadius 객체 생성
    const radiusCode = Object.entries(tokens.radius)
      .map(([key, value]) => `        "${key}": "${value}",`)
      .join('\n');

    // spacing 객체 생성
    const spacingCode = Object.entries(tokens.spacing)
      .map(([key, value]) => `        "${key}": "${value}",`)
      .join('\n');

    // boxShadow 객체 생성
    const shadowCode = Object.entries(tokens.shadow)
      .map(([key, value]) => `        "${key}": "${value}",`)
      .join('\n');

    // fontFamily 객체 생성
    const fontCode = Object.entries(tokens.font)
      .map(([key, value]) => `        "${key}": ["${value}"],`)
      .join('\n');

    // fontSize 객체 생성
    const textCode = Object.entries(tokens.text)
      .map(([key, [size, lineHeight]]) => 
        `        "${key}": ["${size}", { lineHeight: "${lineHeight.lineHeight}" }],`)
      .join('\n');

    // theme.extend 섹션을 찾아서 교체
    const themeExtendRegex = /theme:\s*\{[\s\S]*?extend:\s*\{[\s\S]*?\},?\s*\}/;
    
    const newThemeExtend = `theme: {
    extend: {
      colors: {
${colorsCode}
      },
      borderRadius: {
${radiusCode}
      },
      spacing: {
${spacingCode}
      },
      boxShadow: {
${shadowCode}
      },
      fontFamily: {
${fontCode}
      },
      fontSize: {
${textCode}
      },
    },
  }`;

    config = config.replace(themeExtendRegex, newThemeExtend);

    fs.writeFileSync(TAILWIND_CONFIG_PATH, config, 'utf-8');
    console.log('✅ tailwind.config.ts 업데이트 완료');
  } catch (error) {
    console.error('❌ tailwind.config.ts 업데이트 실패:', error);
    process.exit(1);
  }
}

/**
 * app/globals.css의 CSS 변수 업데이트
 */
function updateGlobalsCss(tokens: DesignTokens): void {
  const GLOBALS_CSS_PATH = path.join(PROJECT_ROOT, 'app', 'globals.css');
  
  try {
    let css = fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8');

    // HSL 변환 헬퍼 (간단한 hex to hsl)
    function hexToHsl(hex: string): string {
      // 간단한 변환 - 실제로는 hex가 아니라 이미 HSL 포맷으로 제공된다고 가정
      // tokens.json의 colors는 hex 형식이므로 그대로 사용
      return hex.replace('#', '');
    }

    // :root 변수 생성
    const cssVars = Object.entries(tokens.colors)
      .map(([key, value]) => `    --${key}: ${value};`)
      .join('\n');

    // :root 섹션 교체 (간단한 버전)
    const rootRegex = /@layer base \{[\s\S]*?:root \{[\s\S]*?\}[\s\S]*?\}/;
    
    const newRoot = `@layer base {
  :root {
    /* Auto-generated from tokens.json */
${cssVars}
    --radius: ${tokens.radius.lg};
  }
}`;

    css = css.replace(rootRegex, newRoot);

    fs.writeFileSync(GLOBALS_CSS_PATH, css, 'utf-8');
    console.log('✅ app/globals.css 업데이트 완료');
  } catch (error) {
    console.error('⚠️  app/globals.css 업데이트 건너뜀:', error);
  }
}

/**
 * 메인 실행
 */
function main() {
  console.log('🎨 Design Token Sync 시작\n');

  const tokens = readTokens();
  console.log(`📦 tokens.json 로드 완료 (version: ${tokens.version}, theme: ${tokens.theme})`);

  updateTailwindConfig(tokens);
  updateGlobalsCss(tokens);

  console.log('\n✨ 동기화 완료!');
  console.log('💡 변경사항을 적용하려면 개발 서버를 재시작하세요: pnpm dev');
}

main();

