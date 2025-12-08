#!/bin/bash

# Validation script for k6 scripts
# This script checks that all k6 scripts have valid syntax

echo "Validating k6 Load Test Scripts Syntax..."
echo "=========================================="

K6_SCRIPTS=(
  "k6/scripts/prescription-processing.js"
  "k6/scripts/delivery-tracking.js"
  "k6/scripts/messaging.js"
  "k6/scripts/api-gateway.js"
  "k6/scripts/database-queries.js"
)

ERRORS=0

for script in "${K6_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "Checking: $script"

    # Basic JavaScript syntax validation (check for common errors)
    if grep -q "from 'k6/" "$script"; then
      echo "  ✓ Has k6 imports"
    else
      echo "  ✗ Missing k6 imports"
      ((ERRORS++))
    fi

    if grep -q "export const options" "$script"; then
      echo "  ✓ Has options export"
    else
      echo "  ✗ Missing options export"
      ((ERRORS++))
    fi

    if grep -q "export default function" "$script"; then
      echo "  ✓ Has default export function"
    else
      echo "  ✗ Missing default export function"
      ((ERRORS++))
    fi

    # Check for matching braces
    open_braces=$(grep -o '{' "$script" | wc -l)
    close_braces=$(grep -o '}' "$script" | wc -l)
    if [ "$open_braces" -eq "$close_braces" ]; then
      echo "  ✓ Braces balanced"
    else
      echo "  ✗ Braces not balanced (open: $open_braces, close: $close_braces)"
      ((ERRORS++))
    fi

  else
    echo "✗ File not found: $script"
    ((ERRORS++))
  fi

  echo ""
done

# Check config files
echo "Validating Configuration Files..."
echo "=================================="

if [ -f "k6/config/thresholds.json" ]; then
  echo "Checking: k6/config/thresholds.json"
  if command -v jq &> /dev/null; then
    if jq . "k6/config/thresholds.json" > /dev/null 2>&1; then
      echo "  ✓ Valid JSON"
    else
      echo "  ✗ Invalid JSON syntax"
      ((ERRORS++))
    fi
  else
    echo "  ⚠ jq not available, skipping JSON validation"
  fi
else
  echo "✗ File not found: k6/config/thresholds.json"
  ((ERRORS++))
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✓ All validations passed!"
  exit 0
else
  echo "✗ Found $ERRORS validation errors"
  exit 1
fi
