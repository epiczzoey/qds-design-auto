import { PrismaClient } from '@/app/generated/prisma';

/**
 * Prisma Client 싱글톤 인스턴스
 * 
 * Development 환경에서는 HMR로 인한 다중 인스턴스 생성을 방지하기 위해
 * global 객체에 저장합니다.
 * 
 * Production 환경에서는 매번 새로운 인스턴스를 생성합니다.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

/**
 * Helper: Generation 생성
 */
export async function createGeneration(data: {
  prompt: string;
  style?: string;
  code?: string;
  status?: string;
}) {
  return db.generation.create({
    data: {
      prompt: data.prompt,
      style: data.style,
      code: data.code ?? '',
      status: data.status ?? 'ready',
    },
  });
}

/**
 * Helper: Generation 조회 (Assets 포함)
 */
export async function getGenerationWithAssets(id: string) {
  return db.generation.findUnique({
    where: { id },
    include: {
      assets: {
        orderBy: { created_at: 'desc' },
      },
    },
  });
}

/**
 * Helper: Asset 생성
 */
export async function createAsset(data: {
  generationId: string;
  kind: string;
  path: string;
}) {
  return db.asset.create({
    data,
  });
}

/**
 * Helper: 최근 Generations 조회
 */
export async function getRecentGenerations(limit = 10) {
  return db.generation.findMany({
    take: limit,
    orderBy: { created_at: 'desc' },
    include: {
      _count: {
        select: { assets: true },
      },
    },
  });
}

/**
 * Helper: Generation 삭제 (Assets도 Cascade로 삭제됨)
 */
export async function deleteGeneration(id: string) {
  return db.generation.delete({
    where: { id },
  });
}

/**
 * Helper: 모든 Generation 삭제 (Assets도 Cascade로 삭제됨)
 */
export async function deleteAllGenerations() {
  return db.generation.deleteMany({});
}
