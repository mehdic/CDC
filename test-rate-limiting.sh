#!/bin/bash

# Test Rate Limiting Fix for E2E Tests
# This script demonstrates that rate limiting is properly disabled in test mode

echo "=========================================="
echo "Rate Limiting E2E Test Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Verify API Gateway is running with NODE_ENV=test
echo "Test 1: Checking API Gateway environment..."
RESPONSE=$(curl -s http://localhost:4000/)
ENV=$(echo "$RESPONSE" | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)

if [ "$ENV" = "test" ]; then
    echo -e "${GREEN}✓ API Gateway running in TEST mode${NC}"
else
    echo -e "${RED}✗ API Gateway NOT in test mode (current: $ENV)${NC}"
    echo -e "${YELLOW}  Note: This is expected if backend was started manually without NODE_ENV=test${NC}"
fi
echo ""

# Test 2: Make 20 rapid requests (should all succeed if rate limiting is disabled)
echo "Test 2: Testing 20 rapid requests (would hit rate limit if enabled)..."
FAILED_REQUESTS=0
SUCCESS_REQUESTS=0

for i in {1..20}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/)
    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS_REQUESTS=$((SUCCESS_REQUESTS + 1))
    else
        FAILED_REQUESTS=$((FAILED_REQUESTS + 1))
        if [ "$HTTP_CODE" = "429" ]; then
            echo -e "${RED}  ✗ Request $i: RATE LIMITED (429)${NC}"
        else
            echo -e "${YELLOW}  ⚠ Request $i: Failed with code $HTTP_CODE${NC}"
        fi
    fi
done

echo ""
echo "Results:"
echo "  - Successful requests: $SUCCESS_REQUESTS/20"
echo "  - Failed/Rate-limited: $FAILED_REQUESTS/20"
echo ""

if [ $SUCCESS_REQUESTS -eq 20 ]; then
    echo -e "${GREEN}✓ All 20 requests succeeded - Rate limiting properly disabled!${NC}"
elif [ $FAILED_REQUESTS -eq 0 ]; then
    echo -e "${GREEN}✓ No rate limit errors detected${NC}"
else
    echo -e "${RED}✗ Some requests were rate limited - Fix may not be working${NC}"
fi
echo ""

# Test 3: Simulate E2E authentication flow (multiple logins)
echo "Test 3: Simulating E2E test authentication flow..."
echo "  (Making 10 login attempts - would hit auth rate limit if enabled)"

AUTH_FAILURES=0
AUTH_SUCCESS=0

for i in {1..10}; do
    # Note: These will fail with 503 (auth service not running), but we're checking for 429 (rate limit)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123"}')

    if [ "$HTTP_CODE" = "429" ]; then
        AUTH_FAILURES=$((AUTH_FAILURES + 1))
        echo -e "${RED}  ✗ Login attempt $i: RATE LIMITED${NC}"
    else
        AUTH_SUCCESS=$((AUTH_SUCCESS + 1))
    fi
done

echo ""
echo "Authentication Results:"
echo "  - Non-rate-limited attempts: $AUTH_SUCCESS/10"
echo "  - Rate-limited attempts: $AUTH_FAILURES/10"
echo ""

if [ $AUTH_FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ No authentication rate limiting - E2E tests can run!${NC}"
else
    echo -e "${RED}✗ Auth endpoints are being rate limited - E2E tests will fail${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "SUMMARY"
echo "=========================================="

if [ $SUCCESS_REQUESTS -eq 20 ] && [ $AUTH_FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "Rate limiting is properly disabled in test mode."
    echo "E2E test suite (695 tests) can now run without hitting rate limits."
    echo ""
    echo "The fix:"
    echo "  1. Added shouldSkipRateLimit() function that checks NODE_ENV=test"
    echo "  2. Applied skip function to all rate limiters (general, auth, authenticated)"
    echo "  3. Updated global-setup.ts to start backend with NODE_ENV=test"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ PARTIAL SUCCESS / VERIFICATION NEEDED${NC}"
    echo ""
    echo "Some tests passed, but verification is incomplete."
    if [ "$ENV" != "test" ]; then
        echo ""
        echo "Note: Backend is not running in test mode."
        echo "To fully test, restart backend with:"
        echo "  cd backend/services/api-gateway"
        echo "  NODE_ENV=test npm run dev"
    fi
    echo ""
    exit 1
fi
