/**
 * 로깅 및 성능 측정 유틸리티
 * 
 * 기능:
 * - 구간별 시간 측정 (ms)
 * - 모델 호출, 렌더링, 스크린샷 성능 추적
 * - 구조화된 로깅
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export enum MetricType {
  MODEL_CALL = "model_call",
  RENDER = "render",
  SCREENSHOT = "screenshot",
  GENERATION_TOTAL = "generation_total",
  VALIDATION = "validation",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  duration?: number;
  metric?: MetricType;
}

interface PerformanceMetric {
  type: MetricType;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * 로거 클래스
 */
class Logger {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * 로그 출력
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // 개발 환경에서는 콘솔에 예쁘게 출력
    if (this.isDevelopment) {
      const emoji = {
        [LogLevel.DEBUG]: "🔍",
        [LogLevel.INFO]: "ℹ️",
        [LogLevel.WARN]: "⚠️",
        [LogLevel.ERROR]: "❌",
      }[level];

      console.log(
        `${emoji} [${entry.timestamp}] ${level}: ${message}`,
        context ? context : ""
      );
    } else {
      // 프로덕션에서는 JSON으로 출력 (로그 수집 도구용)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * 성능 측정 시작
   */
  startMetric(
    metricId: string,
    type: MetricType,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      type,
      startTime: Date.now(),
      metadata,
    };

    this.metrics.set(metricId, metric);
    this.debug(`Metric started: ${type}`, { metricId, ...metadata });
  }

  /**
   * 성능 측정 종료
   */
  endMetric(metricId: string, success: boolean = true): number | null {
    const metric = this.metrics.get(metricId);

    if (!metric) {
      this.warn(`Metric not found: ${metricId}`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    const logData = {
      metricId,
      type: metric.type,
      duration: metric.duration,
      success,
      ...metric.metadata,
    };

    // 성능 임계값 체크
    const thresholds: Record<MetricType, number> = {
      [MetricType.MODEL_CALL]: 30000, // 30초
      [MetricType.RENDER]: 5000, // 5초
      [MetricType.SCREENSHOT]: 20000, // 20초
      [MetricType.GENERATION_TOTAL]: 60000, // 60초
      [MetricType.VALIDATION]: 1000, // 1초
    };

    const threshold = thresholds[metric.type];

    if (metric.duration > threshold) {
      this.warn(
        `⏱️ Slow metric: ${metric.type} took ${metric.duration}ms (threshold: ${threshold}ms)`,
        logData
      );
    } else {
      this.info(
        `✅ Metric completed: ${metric.type} in ${metric.duration}ms`,
        logData
      );
    }

    this.metrics.delete(metricId);
    return metric.duration;
  }

  /**
   * 메트릭 통계 조회
   */
  getMetricStats(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  /**
   * 모든 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

/**
 * 성능 측정 헬퍼 함수
 */
export async function measureAsync<T>(
  metricId: string,
  type: MetricType,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  logger.startMetric(metricId, type, metadata);

  try {
    const result = await fn();
    logger.endMetric(metricId, true);
    return result;
  } catch (error) {
    logger.endMetric(metricId, false);
    logger.error(`Metric failed: ${type}`, {
      metricId,
      error: error instanceof Error ? error.message : String(error),
      ...metadata,
    });
    throw error;
  }
}

/**
 * 동기 함수 성능 측정
 */
export function measureSync<T>(
  metricId: string,
  type: MetricType,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  logger.startMetric(metricId, type, metadata);

  try {
    const result = fn();
    logger.endMetric(metricId, true);
    return result;
  } catch (error) {
    logger.endMetric(metricId, false);
    logger.error(`Metric failed: ${type}`, {
      metricId,
      error: error instanceof Error ? error.message : String(error),
      ...metadata,
    });
    throw error;
  }
}

/**
 * 타이머 유틸리티
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  elapsed(): number {
    return Date.now() - this.startTime;
  }

  elapsedString(): string {
    const ms = this.elapsed();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  reset(): void {
    this.startTime = Date.now();
  }
}

