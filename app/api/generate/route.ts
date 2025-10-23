import { NextRequest, NextResponse } from "next/server";
import { db, createGeneration } from "@/lib/db";
import tokens from "@/tokens.json";
import {
  buildSystemPrompt,
  buildUserPrompt,
  detectTemplateType,
  getStylePresetContext,
  type TemplateType,
} from "@/lib/prompt-templates";
import { generateTailwindCSS, calculateCSSSize } from "@/lib/tailwind-processor";
import { logger, measureAsync, MetricType, Timer } from "@/lib/logger";

/**
 * 생성된 코드 검증 함수 (완화된 검증)
 * 필수 검증만 수행하여 재시도 횟수 감소
 */
function validateGeneratedCode(code: string): { valid: boolean; reason?: string } {
  // export default 컴포넌트 확인 (완화: "default function"도 허용)
  const hasExportDefault = /export\s+default\s+function\s+\w+/.test(code);
  const hasDefaultFunction = /^default\s+function\s+\w+/m.test(code);  // v0 API 버그 대응
  const hasFunctionComponent = /function\s+\w+\s*\(/.test(code);  // 최소 요구사항
  
  if (!hasExportDefault && !hasDefaultFunction && !hasFunctionComponent) {
    return { valid: false, reason: "Code must include a React component function" };
  }

  // <script> 태그 금지 (보안)
  if (/<script/i.test(code)) {
    return { valid: false, reason: "Script tags are not allowed" };
  }

  // dangerouslySetInnerHTML 금지 (보안)
  if (/dangerouslySetInnerHTML/.test(code)) {
    return { valid: false, reason: "dangerouslySetInnerHTML is not allowed" };
  }

  // ✅ 외부 이미지 허용 (성능 개선)
  // ✅ fetch/axios 허용 (사용자가 원할 수 있음)
  // ✅ eval 경고만 (완전 금지하지 않음)

  return { valid: true };
}

/**
 * v0 API 호출 헬퍼 함수 (스트리밍 지원, Vision 지원)
 */
async function callV0API(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  referenceImage?: string // base64 data URL 추가
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // 메시지 구성 - 이미지가 있으면 vision 모드로 전환
    let userContent: any = userPrompt;
    
    if (referenceImage) {
      // OpenAI vision API 형식 (v0도 OpenAI 호환 API)
      userContent = [
        {
          type: "text",
          text: userPrompt
        },
        {
          type: "image_url",
          image_url: {
            url: referenceImage // data:image/png;base64,... 형식
          }
        }
      ];
    }
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const response = await fetch("https://api.v0.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 이미지가 있을 때는 large 모델 사용 (vision 성능 향상)
        model: referenceImage ? "v0-1.5-lg" : "v0-1.5-md",
        messages,
        temperature: 0.2,
        stream: true,  // ✅ 스트리밍 활성화
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("v0 API error:", response.status, errorText);
      
      // 4xx vs 5xx 구분
      if (response.status >= 400 && response.status < 500) {
        return { 
          success: false, 
          error: `클라이언트 오류 (${response.status}): 요청을 확인해주세요. ${response.statusText}` 
        };
      } else {
        return { 
          success: false, 
          error: `서버 오류 (${response.status}): v0 API가 일시적으로 사용할 수 없습니다. ${response.statusText}` 
        };
      }
    }

    // 스트리밍 응답 처리
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: "스트리밍 응답을 읽을 수 없습니다." };
    }

    const decoder = new TextDecoder();
    let code = "";
    let chunkCount = 0;
    const startTime = Date.now();
    
    console.log("[v0 Streaming] Starting to read stream...");
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`[v0 Streaming] Stream complete. Chunks: ${chunkCount}, Duration: ${Date.now() - startTime}ms`);
          break;
        }
        
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        
        if (chunkCount === 1) {
          console.log(`[v0 Streaming] First chunk received at ${Date.now() - startTime}ms`);
        }
        
        const lines = chunk.split("\n").filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                code += delta;
              }
            } catch (e) {
              // JSON 파싱 실패는 무시
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    console.log(`[v0 Streaming] Total code length: ${code.length} chars`);

    if (!code) {
      return { success: false, error: "v0 API에서 코드를 생성하지 못했습니다." };
    }

    // 코드에서 마크다운 코드 블록 제거 (```tsx ... ```)
    let cleanedCode = code.trim();
    if (cleanedCode.startsWith("```")) {
      cleanedCode = cleanedCode.replace(/^```(?:tsx|typescript|ts|jsx|javascript|js)?\n?/, "");
      cleanedCode = cleanedCode.replace(/\n?```$/, "");
      cleanedCode = cleanedCode.trim();
    }

    return { success: true, code: cleanedCode };
  } catch (error) {
    console.error("v0 API call error:", error);
    return { success: false, error: "네트워크 오류: v0 API 호출에 실패했습니다." };
  }
}

export async function POST(req: NextRequest) {
  const totalTimer = new Timer();
  const generationMetricId = `gen_${Date.now()}`;
  
  logger.startMetric(generationMetricId, MetricType.GENERATION_TOTAL);

  try {
    const { prompt, style = "default", template, referenceImage } = await req.json();

    // 입력 검증
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      logger.warn("Invalid prompt received", { prompt });
      return NextResponse.json(
        { error: "유효한 프롬프트가 필요합니다." },
        { status: 400 }
      );
    }

    // 이미지 검증 (선택사항)
    if (referenceImage) {
      // Base64 data URL 형식 확인
      if (!referenceImage.startsWith("data:image/")) {
        logger.warn("Invalid image format", { referenceImage: referenceImage.substring(0, 50) });
        return NextResponse.json(
          { error: "유효하지 않은 이미지 형식입니다. data URL이어야 합니다." },
          { status: 400 }
        );
      }

      // 이미지 크기 확인 (base64는 약 33% 크기 증가)
      const imageSizeKB = (referenceImage.length * 3) / 4 / 1024;
      if (imageSizeKB > 5000) {
        logger.warn("Image too large", { imageSizeKB: Math.round(imageSizeKB) });
        return NextResponse.json(
          { error: `이미지가 너무 큽니다 (${Math.round(imageSizeKB)}KB). 최대 5MB까지 가능합니다.` },
          { status: 400 }
        );
      }

      logger.info("Image-to-image generation requested", {
        promptLength: prompt.length,
        imageSizeKB: Math.round(imageSizeKB),
      });
    }

    // API 키 확인
    const apiKey = process.env.V0_API_KEY;
    if (!apiKey || apiKey === "your_v0_api_key_here") {
      logger.error("V0_API_KEY not configured");
      return NextResponse.json(
        { error: "V0_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
        { status: 500 }
      );
    }

    // 템플릿 타입 결정 (자동 감지 또는 명시적 지정)
    const templateType: TemplateType = template || detectTemplateType(prompt);
    logger.info(`Generation request received`, {
      promptLength: prompt.length,
      style,
      template: templateType,
    });

    // Generation 레코드 생성
    const generation = await createGeneration({
      prompt,
      style,
      code: "",
      status: "pending",
    });

    logger.info(`Generation created`, { generationId: generation.id });

    // SYSTEM_PROMPT 생성 (tokens 기반)
    let systemPrompt = buildSystemPrompt(tokens);
    
    // 이미지 참조 시 프롬프트 강화
    if (referenceImage) {
      systemPrompt += `\n\n🎨 VISION MODE - IMAGE REFERENCE:
The user has provided a reference image. Your task:
1. Carefully analyze the image's design, layout, colors, UI patterns, and visual hierarchy
2. Create a similar component using React and Tailwind CSS
3. Match the visual style, spacing, typography, and structure as closely as possible
4. Follow all the rules above (no imports, whitelisted Tailwind classes only, etc.)
5. If the image shows a specific UI pattern (card, form, navigation, etc.), replicate that pattern

IMPORTANT: Focus on visual similarity while maintaining code quality and accessibility.`;
    }

    let finalCode = "";
    let attempts = 0;
    const maxAttempts = 2; // 최초 시도 + 1회 재시도
    let lastValidationReason: string | undefined;

    // 재시도 루프
    while (attempts < maxAttempts) {
      attempts++;
      logger.info(`Generation attempt ${attempts}/${maxAttempts}`, {
        generationId: generation.id,
        hasImage: !!referenceImage,
      });

      // USER_PROMPT 생성 (template 적용)
      let userPrompt = buildUserPrompt(
        prompt,
        tokens,
        templateType,
        lastValidationReason
      );
      
      // 이미지 참조 시 유저 프롬프트에 힌트 추가
      if (referenceImage && attempts === 1) {
        userPrompt = `[참조 이미지 기반 요청]\n\n${userPrompt}\n\n위 이미지와 비슷한 디자인으로 만들어주세요.`;
      }

      // 모델 호출 (성능 측정, 이미지 포함)
      const modelMetricId = `model_${generation.id}_${attempts}`;
      const result = await measureAsync(
        modelMetricId,
        MetricType.MODEL_CALL,
        () => callV0API(apiKey, systemPrompt, userPrompt, referenceImage),
        { generationId: generation.id, attempt: attempts, hasImage: !!referenceImage }
      );

      if (!result.success) {
        // API 호출 실패
        logger.error("Model API call failed", {
          generationId: generation.id,
          error: result.error,
          attempt: attempts,
        });

        await db.generation.update({
          where: { id: generation.id },
          data: { status: "failed" },
        });

        logger.endMetric(generationMetricId, false);

        return NextResponse.json(
          { error: result.error || "코드 생성에 실패했습니다." },
          { status: 500 }
        );
      }

      // 코드 검증 (성능 측정)
      const validationMetricId = `validation_${generation.id}_${attempts}`;
      logger.startMetric(validationMetricId, MetricType.VALIDATION);
      const validation = validateGeneratedCode(result.code!);
      logger.endMetric(validationMetricId);
      
      if (validation.valid) {
        // 검증 성공
        logger.info("Code validation passed", {
          generationId: generation.id,
          attempt: attempts,
        });
        finalCode = result.code!;
        break;
      } else {
        // 검증 실패
        logger.warn("Code validation failed", {
          generationId: generation.id,
          reason: validation.reason,
          attempt: attempts,
        });
        lastValidationReason = validation.reason;

        if (attempts >= maxAttempts) {
          // 재시도 횟수 초과
          logger.error("Max retry attempts exceeded", {
            generationId: generation.id,
            reason: validation.reason,
          });

          await db.generation.update({
            where: { id: generation.id },
            data: { 
              status: "failed",
              code: result.code! // 실패한 코드도 저장 (디버깅용)
            },
          });

          logger.endMetric(generationMetricId, false);

          return NextResponse.json(
            { 
              error: `코드 검증 실패: ${validation.reason}. 최대 재시도 횟수를 초과했습니다.`,
              details: validation.reason,
            },
            { status: 422 } // Unprocessable Entity
          );
        }

        // 재시도 계속
        logger.info("Retrying code generation", {
          generationId: generation.id,
          reason: validation.reason,
        });
      }
    }

    // ✅ CSS 생성 (서버 사이드 Tailwind 처리)
    logger.info("Generating Tailwind CSS from code", { generationId: generation.id });
    const cssMetricId = `css_${generation.id}`;
    logger.startMetric(cssMetricId, MetricType.VALIDATION); // CSS 생성도 validation으로 분류
    
    let generatedCSS = "";
    try {
      generatedCSS = await generateTailwindCSS(finalCode);
      const cssSize = calculateCSSSize(generatedCSS);
      logger.info("CSS generated successfully", {
        generationId: generation.id,
        cssSize: `${cssSize.toFixed(2)} KB`,
      });
    } catch (cssError) {
      logger.error("CSS generation failed, continuing without CSS", {
        generationId: generation.id,
        error: cssError instanceof Error ? cssError.message : String(cssError),
      });
      // CSS 생성 실패해도 계속 진행 (코드는 성공했으므로)
    } finally {
      logger.endMetric(cssMetricId);
    }

    // 성공: Generation 업데이트 (코드 + CSS)
    await db.generation.update({
      where: { id: generation.id },
      data: {
        code: finalCode,
        css: generatedCSS || null,
        status: "completed",
      },
    });

    const totalDuration = logger.endMetric(generationMetricId, true);

    logger.info("Generation completed successfully", {
      generationId: generation.id,
      attempts,
      template: templateType,
      totalDuration: totalTimer.elapsedString(),
      codeLength: finalCode.length,
      cssLength: generatedCSS.length,
    });

    return NextResponse.json({
      id: generation.id,
      code: finalCode,
      css: generatedCSS,
      status: "completed",
      attempts,
      template: templateType,
      metrics: {
        totalDuration: totalDuration || totalTimer.elapsed(),
        codeLength: finalCode.length,
        cssLength: generatedCSS.length,
      },
    });

  } catch (error) {
    logger.error("Generate API error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.endMetric(generationMetricId, false);
    
    // 에러 타입별 메시지
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "잘못된 JSON 형식입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

