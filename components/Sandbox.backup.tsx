"use client";

import { useEffect, useRef, useState } from "react";
import { buildSrcDoc, buildErrorSrcDoc } from "@/lib/sandbox-template";

interface SandboxProps {
  code: string;
  className?: string;
}

/**
 * Sandbox 컴포넌트
 * iframe srcDoc을 사용하여 생성된 코드를 안전하게 렌더링합니다.
 * sandbox 속성으로 보안을 강화합니다.
 */
export default function Sandbox({ code, className = "" }: SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [srcDoc, setSrcDoc] = useState<string>("");

  useEffect(() => {
    try {
      // 코드 검증
      if (!code || typeof code !== "string") {
        throw new Error("유효하지 않은 코드입니다.");
      }

      // srcDoc 생성
      const doc = buildSrcDoc(code);
      setSrcDoc(doc);
      setError(null);
    } catch (err) {
      console.error("Sandbox error:", err);
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      setSrcDoc(buildErrorSrcDoc(errorMessage));
    }
  }, [code]);

  // iframe 내부 에러 리스닝 (postMessage 사용 가능)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // iframe 내부에서 에러 발생 시 처리 (필요시 구현)
      if (event.data?.type === "sandbox-error") {
        console.error("Sandbox runtime error:", event.data.error);
        setError(event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {error && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-destructive/90 text-destructive-foreground p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold text-sm mb-1">⚠️ 샌드박스 오류</h3>
          <p className="text-xs">{error}</p>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        title="Component Preview Sandbox"
        className="w-full h-full border-0"
        sandbox="allow-scripts" // 스크립트만 허용, 폼 제출/네비게이션 등은 차단
        style={{
          colorScheme: "dark", // 다크 테마 힌트
        }}
      />
    </div>
  );
}

