"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Status Widget
 * 
 * 페이지 하단에 시스템 상태를 표시하는 위젯
 * - 성공률
 * - 평균 응답 시간
 * - 최근 에러 수
 */

interface StatusMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number; // ms
  lastError?: string;
  lastUpdated: string;
}

export default function StatusWidget() {
  const [metrics, setMetrics] = useState<StatusMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // localStorage에서 메트릭 로드
    loadMetrics();

    // 10초마다 새로고침
    const interval = setInterval(loadMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadMetrics = () => {
    try {
      const stored = localStorage.getItem("qds-metrics");
      if (stored) {
        const data = JSON.parse(stored);
        setMetrics(data);
      } else {
        // 초기값
        setMetrics({
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  if (!metrics) return null;

  const successRate =
    metrics.totalRequests > 0
      ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)
      : "0";

  const avgResponseTime =
    metrics.averageResponseTime > 1000
      ? `${(metrics.averageResponseTime / 1000).toFixed(1)}s`
      : `${metrics.averageResponseTime.toFixed(0)}ms`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-md text-xs font-medium transition-colors shadow-lg"
      >
        {isVisible ? "Hide" : "Status"} 📊
      </button>

      {/* Status Card */}
      {isVisible && (
        <Card className="w-64 shadow-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-semibold">System Status</h3>
              <div
                className={`w-2 h-2 rounded-full ${
                  parseFloat(successRate) >= 90
                    ? "bg-green-500"
                    : parseFloat(successRate) >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
            </div>

            {/* Success Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Success Rate</span>
                <span className="text-sm font-bold text-fg">{successRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            {/* Response Time */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Response</span>
              <span className="text-sm font-mono text-fg">{avgResponseTime}</span>
            </div>

            {/* Request Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted rounded p-2">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-sm font-bold">{metrics.totalRequests}</div>
              </div>
              <div className="bg-green-500/10 rounded p-2">
                <div className="text-xs text-green-600 dark:text-green-400">Success</div>
                <div className="text-sm font-bold">{metrics.successfulRequests}</div>
              </div>
              <div className="bg-red-500/10 rounded p-2">
                <div className="text-xs text-red-600 dark:text-red-400">Failed</div>
                <div className="text-sm font-bold">{metrics.failedRequests}</div>
              </div>
            </div>

            {/* Last Error */}
            {metrics.lastError && (
              <div className="bg-destructive/10 rounded p-2">
                <div className="text-xs text-destructive font-medium mb-1">
                  Last Error
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {metrics.lastError}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              Updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 메트릭 업데이트 헬퍼 함수
 * API 호출 후 사용
 */
export function updateMetrics(
  success: boolean,
  responseTime: number,
  error?: string
) {
  try {
    const stored = localStorage.getItem("qds-metrics");
    const current: StatusMetrics = stored
      ? JSON.parse(stored)
      : {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          lastUpdated: new Date().toISOString(),
        };

    // 업데이트
    current.totalRequests += 1;
    if (success) {
      current.successfulRequests += 1;
    } else {
      current.failedRequests += 1;
      if (error) {
        current.lastError = error;
      }
    }

    // 평균 응답 시간 계산 (이동 평균)
    current.averageResponseTime =
      (current.averageResponseTime * (current.totalRequests - 1) + responseTime) /
      current.totalRequests;

    current.lastUpdated = new Date().toISOString();

    localStorage.setItem("qds-metrics", JSON.stringify(current));
  } catch (error) {
    console.error("Failed to update metrics:", error);
  }
}

/**
 * 메트릭 초기화 함수
 */
export function resetMetrics() {
  localStorage.removeItem("qds-metrics");
}

