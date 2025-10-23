import { test, expect } from '@playwright/test';

/**
 * E2E 테스트 예시
 * 실제 프로젝트에서는 전체 플로우를 테스트
 */
test('홈페이지 로드 테스트', async ({ page }) => {
  await page.goto('/');

  // 페이지 제목 확인
  await expect(page).toHaveTitle(/QDS Design Auto/);

  // 메인 헤더 확인
  const heading = page.getByRole('heading', { name: /QDS Design Auto/i });
  await expect(heading).toBeVisible();

  // 프롬프트 입력 필드 확인
  const textarea = page.getByPlaceholder(/예: 현대적인 로그인/);
  await expect(textarea).toBeVisible();
});

test.skip('컴포넌트 생성 플로우 (V0 API 필요)', async ({ page }) => {
  // TODO: V0 API 키 설정 후 활성화
  await page.goto('/');
  
  // 프롬프트 입력
  await page.getByPlaceholder(/예: 현대적인 로그인/).fill('간단한 버튼 컴포넌트');
  
  // 생성 버튼 클릭
  await page.getByRole('button', { name: /생성하기/ }).click();
  
  // 로딩 상태 확인
  await expect(page.getByText(/생성 중/)).toBeVisible();
  
  // 결과 확인 (타임아웃 30초)
  await expect(page.getByText(/생성 정보/)).toBeVisible({ timeout: 30000 });
});

