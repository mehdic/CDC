#!/bin/bash
# Playwright Test Reminder Hook
# Runs at the end of each Claude response to remind about testing frontend changes

# Read JSON input from stdin
read -r json_input

# Get the current working directory from hook input
cwd=$(echo "$json_input" | jq -r '.cwd // empty')
if [ -z "$cwd" ]; then
  cwd="/Users/chaouachimehdi/IdeaProjects/CDC"
fi

cd "$cwd" 2>/dev/null || exit 0

# Check if any frontend files were modified (staged or unstaged)
frontend_changes=$(git diff --name-only HEAD 2>/dev/null | grep -E "^web/src/.*\.(tsx?|jsx?)$" | head -5)
staged_frontend=$(git diff --cached --name-only 2>/dev/null | grep -E "^web/src/.*\.(tsx?|jsx?)$" | head -5)

# Combine and dedupe
all_frontend_changes=$(echo -e "${frontend_changes}\n${staged_frontend}" | grep -v "^$" | sort -u)

if [ -n "$all_frontend_changes" ]; then
  count=$(echo "$all_frontend_changes" | wc -l | tr -d ' ')

  echo ""
  echo "=================================================="
  echo "🧪 PLAYWRIGHT TEST REMINDER"
  echo "=================================================="
  echo ""
  echo "Frontend files modified ($count files):"
  echo "$all_frontend_changes" | sed 's/^/  - /'
  echo ""
  echo "Before finishing, run:"
  echo "  npx playwright test e2e/tests/pharmacist/ --project=pharmacist --reporter=list"
  echo ""
  echo "=================================================="
fi

exit 0
