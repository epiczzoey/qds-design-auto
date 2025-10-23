import { NextRequest, NextResponse } from "next/server";
import { getRecentGenerations, deleteAllGenerations } from "@/lib/db";
import fs from "fs";
import path from "path";

/**
 * Generations 목록 API
 * GET /api/generations?limit=10
 * 
 * 기능:
 * - 최근 생성된 Generation 목록 반환
 * - 썸네일(screenshot_url) 포함
 * - 페이지네이션 지원 (limit)
 */

interface GenerationsResponse {
  generations: Array<{
    id: string;
    prompt: string;
    style: string | null;
    code: string;
    status: string;
    screenshot_url: string | null;
    created_at: Date;
    _count: {
      assets: number;
    };
  }>;
  total: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // limit 유효성 검사
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // DB에서 최근 Generations 조회
    const generations = await getRecentGenerations(limit);

    return NextResponse.json<GenerationsResponse>(
      {
        generations,
        total: generations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Generations API] Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch generations" },
      { status: 500 }
    );
  }
}

/**
 * 전체 Generations 삭제 API
 * DELETE /api/generations
 * 
 * 기능:
 * - 모든 Generation 및 관련 Assets 삭제 (DB cascade)
 * - 모든 스크린샷 파일 삭제 (파일 시스템)
 */
export async function DELETE(req: NextRequest) {
  try {
    // 1. 현재 모든 Generations 조회 (스크린샷 경로 확인용)
    const allGenerations = await getRecentGenerations(1000); // 충분히 큰 숫자
    
    // 2. 스크린샷 파일들 삭제
    let deletedFiles = 0;
    let failedFiles = 0;
    
    for (const gen of allGenerations) {
      if (gen.screenshot_url) {
        try {
          const fileName = gen.screenshot_url.split('/').pop();
          if (fileName) {
            const filePath = path.join(process.cwd(), 'public', 'screenshots', fileName);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              deletedFiles++;
            }
          }
        } catch (fileError) {
          console.error(`[Delete All] Failed to delete file:`, fileError);
          failedFiles++;
        }
      }
    }

    // 3. DB에서 모든 Generations 삭제 (Assets는 cascade로 자동 삭제됨)
    const result = await deleteAllGenerations();

    console.log(`[Delete All] Deleted ${result.count} generations, ${deletedFiles} files (${failedFiles} failed)`);

    return NextResponse.json(
      { 
        success: true, 
        message: "All generations deleted successfully",
        deleted: result.count,
        deletedFiles,
        failedFiles
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Delete All Generations API] Error:", error);
    
    return NextResponse.json(
      { error: "Failed to delete all generations" },
      { status: 500 }
    );
  }
}
