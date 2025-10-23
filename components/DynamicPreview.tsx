"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { extractComponentName } from "@/lib/typescript-utils";
import tokens from "@/tokens.json";

// Babel standalone을 동적으로 로드하기 위한 타입
declare global {
  interface Window {
    Babel?: {
      transform: (code: string, options: any) => { code: string };
    };
    tokens: any;
  }
}

interface DynamicPreviewProps {
  code: string;
  css?: string; // 서버에서 생성된 Tailwind CSS
  className?: string;
}

/**
 * 동적 컴포넌트 직접 렌더링
 * iframe 없이 생성된 코드를 메인 페이지에서 직접 실행하여 렌더링합니다.
 * Babel Standalone을 사용하여 JSX를 트랜스파일합니다.
 * 서버에서 생성된 Tailwind CSS를 style 태그로 주입합니다.
 * 
 * 주의: new Function을 사용하므로 신뢰할 수 있는 코드만 렌더링해야 합니다.
 * 내부 도구 및 MVP용으로 사용하세요.
 */
export default function DynamicPreview({ code, css, className = "" }: DynamicPreviewProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [babelLoaded, setBabelLoaded] = useState(false);
  const [cssInjected, setCssInjected] = useState(false);

  // 1. Tailwind CDN 로드 (서버 사이드 CSS 대신)
  useEffect(() => {
    if (typeof window === "undefined") {
      setCssInjected(true);
      return;
    }

    // Tailwind CDN이 이미 로드되었는지 확인
    if (document.getElementById("tailwind-cdn")) {
      console.log("[DynamicPreview] Tailwind CDN already loaded");
      setCssInjected(true);
      return;
    }

    // Tailwind CDN 스크립트 로드
    const script = document.createElement("script");
    script.id = "tailwind-cdn";
    script.src = "https://cdn.tailwindcss.com";
    script.onload = () => {
      console.log("[DynamicPreview] ✅ Tailwind CDN loaded");
      
      // Tailwind 설정 주입 (디자인 토큰 적용)
      if ((window as any).tailwind) {
        (window as any).tailwind.config = {
          theme: {
            extend: {
              colors: tokens.colors,
              borderRadius: tokens.radius,
              spacing: tokens.spacing,
            },
          },
        };
        console.log("[DynamicPreview] ✅ Tailwind config applied");
      }
      
      setCssInjected(true);
    };
    script.onerror = () => {
      console.error("[DynamicPreview] ❌ Failed to load Tailwind CDN");
      setCssInjected(true); // 실패해도 계속 진행
    };
    document.head.appendChild(script);

    // 서버 생성 CSS가 있으면 함께 주입 (폴백)
    if (css && css.length > 0) {
      const styleElement = document.createElement("style");
      styleElement.id = "dynamic-preview-css";
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
      console.log(`[DynamicPreview] Server CSS injected: ${(css.length / 1024).toFixed(2)} KB`);
    }

    // Cleanup
    return () => {
      const cdnScript = document.getElementById("tailwind-cdn");
      const style = document.getElementById("dynamic-preview-css");
      if (cdnScript) cdnScript.remove();
      if (style) style.remove();
    };
  }, [css]);

  // 2. Babel Standalone 로드
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Babel) {
      const script = document.createElement("script");
      script.src = "/vendor/babel-standalone.min.js";
      script.async = true;
      script.onload = () => setBabelLoaded(true);
      script.onerror = () => {
        setError("Babel을 로드할 수 없습니다.");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else if (window.Babel) {
      setBabelLoaded(true);
    }
  }, []);

  // 3. 컴포넌트 생성 (CSS와 Babel이 모두 준비된 후)
  useEffect(() => {
    if (!babelLoaded || !cssInjected) return;

    setIsLoading(true);
    setError(null);
    setComponent(null);

    try {
      // 코드 검증
      if (!code || typeof code !== "string") {
        throw new Error("유효하지 않은 코드입니다.");
      }

      // 컴포넌트 이름 추출 (원본에서)
      const componentName = extractComponentName(code);
      
      if (!componentName) {
        throw new Error(
          "컴포넌트를 찾을 수 없습니다. export default function ComponentName() 형식으로 작성해주세요."
        );
      }

      // Design tokens를 전역으로 제공
      if (typeof window !== "undefined") {
        (window as any).tokens = tokens;
      }

      // export 및 default 키워드 제거 (v0 API가 불완전한 export를 생성하는 경우 대비)
      let cleanCode = code
        .replace(/export\s+default\s+/g, '')  // "export default " 제거
        .replace(/^export\s+/gm, '')  // 줄 시작의 "export " 제거
        .replace(/^default\s+/gm, '');  // 줄 시작의 "default " 제거 (v0 API 버그 대응)

      console.log("=== Original Code (cleaned) ===");
      console.log(cleanCode);
      
      // Babel로 TypeScript + JSX를 JavaScript로 트랜스파일
      let babelCode: string;
      try {
        babelCode = window.Babel!.transform(cleanCode, {
          presets: ["typescript", "react"],
          filename: "dynamic-component.tsx",
        }).code;
      } catch (babelError) {
        console.error("Babel transpilation error:", babelError);
        throw new Error(
          `코드 변환 중 오류가 발생했습니다.\n\n` +
          `${babelError instanceof Error ? babelError.message : String(babelError)}\n\n` +
          `힌트: 생성된 코드에 문법 오류가 있을 수 있습니다. 이 컴포넌트를 삭제하고 다시 생성해보세요.`
        );
      }

      console.log("=== Transpiled Code (JavaScript) ===");
      console.log(babelCode);

      // 동적 컴포넌트 생성
      const finalCode = `
        "use strict";
        const { useState, useEffect, useRef, useCallback, useMemo, Fragment, createElement } = React;
        
        // Design tokens를 전역으로 제공
        const tokens = window.tokens;
        
        ${babelCode}
        
        return ${componentName};
      `;

      const componentFunc = new Function("React", finalCode);

      // 컴포넌트 함수 생성
      const DynamicComponent = componentFunc(React);

      // 함수인지 확인
      if (typeof DynamicComponent !== "function") {
        throw new Error("생성된 컴포넌트가 함수가 아닙니다.");
      }

      setComponent(() => DynamicComponent);
      setError(null);
    } catch (err) {
      console.error("Component parsing error:", err);
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      setComponent(null);
    } finally {
      setIsLoading(false);
    }
  }, [code, babelLoaded, cssInjected]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`min-h-[500px] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">컴포넌트를 로딩하는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`min-h-[500px] flex items-center justify-center p-8 ${className}`}>
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-6 max-w-2xl w-full">
          <h3 className="text-destructive font-semibold text-lg mb-2">⚠️ 렌더링 오류</h3>
          <pre className="text-sm text-fg bg-bg p-4 rounded border border-border overflow-x-auto whitespace-pre-wrap break-words">
            {error}
          </pre>
          <p className="text-xs text-muted-foreground mt-4">
            힌트: export default function ComponentName() 형식으로 컴포넌트를 작성하세요.
          </p>
        </div>
      </div>
    );
  }

  // 컴포넌트가 없는 경우
  if (!Component) {
    return (
      <div className={`min-h-[500px] flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">컴포넌트를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 정상 렌더링
  return (
    <div 
      className={`w-full h-full relative ${className}`}
      data-component-loaded="true"
      data-testid="dynamic-preview-loaded"
      style={{
        position: 'relative',
        isolation: 'isolate',  // CSS isolation: 새로운 stacking context 생성
        contain: 'layout style paint',  // CSS containment: 레이아웃/스타일/페인트 격리
        overflow: 'auto',  // 컨테이너 내부로 스크롤 제한
      }}
    >
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </div>
  );
}

/**
 * 에러 바운더리 컴포넌트
 * 동적 컴포넌트의 런타임 에러를 격리합니다.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dynamic component runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-8">
          <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-destructive font-semibold text-lg mb-2">🔴 런타임 오류</h3>
            <pre className="text-sm text-fg bg-bg p-4 rounded border border-border overflow-x-auto whitespace-pre-wrap break-words">
              {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
            </pre>
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-fg">
                스택 트레이스 보기
              </summary>
              <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto whitespace-pre-wrap break-words">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

