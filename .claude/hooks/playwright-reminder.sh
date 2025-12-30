#!/bin/bash
# Playwright Test Reminder Hook
# Runs at the end of each Claude response to remind about testing frontend changes
#
# TESTING RULE (MANDATORY):
# 1. Don't just run existing tests blindly
# 2. Find existing test(s) that cover the changed functionality
# 3. If no test exists for the change, CREATE a new test
# 4. Then run the relevant tests to verify

# Read JSON input from stdin
read -r json_input

# Get the current working directory from hook input
cwd=$(echo "$json_input" | jq -r '.cwd // empty')
if [ -z "$cwd" ]; then
  cwd="/Users/chaouachimehdi/IdeaProjects/CDC"
fi

cd "$cwd" 2>/dev/null || exit 0

# Check if any frontend files were modified (staged or unstaged)
frontend_changes=$(git diff --name-only HEAD 2>/dev/null | grep -E "^web/src/.*\.(tsx?|jsx?)$" | head -10)
staged_frontend=$(git diff --cached --name-only 2>/dev/null | grep -E "^web/src/.*\.(tsx?|jsx?)$" | head -10)

# Combine and dedupe
all_frontend_changes=$(echo -e "${frontend_changes}\n${staged_frontend}" | grep -v "^$" | sort -u)

if [ -n "$all_frontend_changes" ]; then
  count=$(echo "$all_frontend_changes" | wc -l | tr -d ' ')

  echo ""
  echo "========================================================================"
  echo "🧪 PLAYWRIGHT TEST REQUIREMENT"
  echo "========================================================================"
  echo ""
  echo "Frontend files modified ($count files):"
  echo "$all_frontend_changes" | sed 's/^/  - /'
  echo ""
  echo "MANDATORY TESTING STEPS:"
  echo "  1. Find existing test(s) that cover the changed functionality"
  echo "     - Search in web/e2e/tests/ for related test files"
  echo "     - Look for tests that exercise the modified component/feature"
  echo ""
  echo "  2. If no relevant test exists, CREATE a new test that:"
  echo "     - Tests the specific functionality you changed"
  echo "     - Covers happy path and edge cases"
  echo "     - Uses proper selectors (data-testid preferred)"
  echo ""
  echo "  3. Run the relevant tests:"
  echo "     npx playwright test e2e/tests/pharmacist/<relevant-test>.spec.ts --project=pharmacist --reporter=list"
  echo ""
  echo "  DO NOT just run all existing tests and assume the fix works!"
  echo "  You must verify YOUR SPECIFIC CHANGE is covered by a test."
  echo "========================================================================"
fi

exit 0
