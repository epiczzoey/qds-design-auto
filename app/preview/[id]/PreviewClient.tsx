"use client";

import DynamicPreview from "@/components/DynamicPreview";

interface PreviewClientProps {
  code: string;
  css?: string | null;
}

/**
 * 프리뷰 클라이언트 컴포넌트
 * 생성된 React 코드를 직접 렌더링합니다.
 */
export default function PreviewClient({ code, css }: PreviewClientProps) {
  return (
    <div className="w-full h-screen overflow-hidden">
      <DynamicPreview 
        code={code}
        css={css || undefined}
        className="w-full h-full"
      />
    </div>
  );
}

