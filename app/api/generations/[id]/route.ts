import { NextRequest, NextResponse } from "next/server";
import { getGenerationWithAssets, deleteGeneration } from "@/lib/db";
import fs from "fs";
import path from "path";

/**
 * 개별 Generation 조회 API
 * GET /api/generations/[id]
 * 
 * 기능:
 * - 특정 Generation의 상세 정보 반환
 * - Assets 포함
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // DB에서 Generation 조회 (Assets 포함)
    const generation = await getGenerationWithAssets(id);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(generation, { status: 200 });
  } catch (error) {
    console.error("[Generation API] Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch generation" },
      { status: 500 }
    );
  }
}

/**
 * 개별 Generation 삭제 API
 * DELETE /api/generations/[id]
 * 
 * 기능:
 * - Generation 및 관련 Assets 삭제 (DB cascade)
 * - 스크린샷 파일 삭제 (파일 시스템)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // DB에서 Generation 조회 (스크린샷 경로 확인용)
    const generation = await getGenerationWithAssets(id);

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // 1. 스크린샷 파일 삭제 (있는 경우)
    if (generation.screenshot_url) {
      try {
        // URL에서 파일 경로 추출: /screenshots/xxx.png -> public/screenshots/xxx.png
        const fileName = generation.screenshot_url.split('/').pop();
        if (fileName) {
          const filePath = path.join(process.cwd(), 'public', 'screenshots', fileName);
          
          // 파일 존재 확인 후 삭제
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Delete] Screenshot deleted: ${filePath}`);
          }
        }
      } catch (fileError) {
        console.error(`[Delete] Failed to delete screenshot file:`, fileError);
        // 파일 삭제 실패는 무시하고 계속 진행 (DB 정합성 우선)
      }
    }

    // 2. DB에서 삭제 (Assets는 cascade로 자동 삭제됨)
    await deleteGeneration(id);

    console.log(`[Delete] Generation deleted: ${id}`);

    return NextResponse.json(
      { 
        success: true, 
        message: "Generation deleted successfully",
        id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Delete Generation API] Error:", error);
    
    return NextResponse.json(
      { error: "Failed to delete generation" },
      { status: 500 }
    );
  }
}
