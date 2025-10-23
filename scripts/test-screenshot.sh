#!/bin/bash
# 스크린샷 API 테스트 스크립트
# 사용법: bash scripts/test-screenshot.sh [generation-id]

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API URL
API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/screenshot"

echo -e "${BLUE}📸 스크린샷 API 테스트${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generation ID 가져오기
if [ -z "$1" ]; then
  echo -e "${YELLOW}⚠️  Generation ID가 제공되지 않았습니다.${NC}"
  echo "사용법: bash scripts/test-screenshot.sh [generation-id]"
  echo ""
  echo "예시:"
  echo "  bash scripts/test-screenshot.sh clxxx123456"
  exit 1
fi

GENERATION_ID="$1"

echo -e "${BLUE}🔍 테스트 정보${NC}"
echo "  Generation ID: $GENERATION_ID"
echo "  API Endpoint: $ENDPOINT"
echo ""

# 테스트 1: 기본 스크린샷
echo -e "${BLUE}테스트 1: 기본 스크린샷 (1280x800)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$GENERATION_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ 성공${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}❌ 실패 (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
  exit 1
fi

echo ""

# 테스트 2: 커스텀 viewport
echo -e "${BLUE}테스트 2: 커스텀 viewport (1920x1080)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$GENERATION_ID\",\"viewport\":{\"width\":1920,\"height\":1080}}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ 성공${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}❌ 실패 (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

echo ""

# 테스트 3: Full page 스크린샷
echo -e "${BLUE}테스트 3: Full page 스크린샷${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$GENERATION_ID\",\"fullPage\":true}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ 성공${NC}"
  echo "$BODY" | jq .
else
  echo -e "${RED}❌ 실패 (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

echo ""

# 테스트 4: 잘못된 ID (에러 케이스)
echo -e "${BLUE}테스트 4: 잘못된 ID (에러 케이스)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"id":"invalid-id-12345"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}✅ 예상된 에러 응답 (404)${NC}"
  echo "$BODY" | jq .
else
  echo -e "${YELLOW}⚠️  예상과 다른 응답 (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

echo ""

# 테스트 5: 잘못된 viewport (에러 케이스)
echo -e "${BLUE}테스트 5: 잘못된 viewport (에러 케이스)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$GENERATION_ID\",\"viewport\":{\"width\":100,\"height\":100}}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ 예상된 에러 응답 (400)${NC}"
  echo "$BODY" | jq .
else
  echo -e "${YELLOW}⚠️  예상과 다른 응답 (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq .
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 모든 테스트 완료${NC}"
echo ""
echo -e "${BLUE}📁 생성된 스크린샷:${NC}"
ls -lh public/screenshots/ | grep "$GENERATION_ID" || echo "  (없음)"

