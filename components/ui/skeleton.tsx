import { cn } from "@/lib/utils";

/**
 * Skeleton 컴포넌트 - 로딩 상태 표시
 * 컨텐츠 로딩 중 placeholder로 사용
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  );
}

export { Skeleton };

