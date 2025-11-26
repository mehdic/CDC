#!/bin/bash
# E2E Test Analysis Script

echo "=== E2E TEST SUITE ANALYSIS ==="
echo ""
echo "📊 Total Test Files:"
find e2e/tests -name "*.spec.ts" | wc -l

echo ""
echo "🚫 Tests with Undefined Fixtures:"
echo ""
echo "Tests using 'patientPage' (UNDEFINED):"
grep -l "{ patientPage }" e2e/tests/*.spec.ts | sed 's|e2e/tests/||' | sed 's|.spec.ts||'

echo ""
echo "Tests using 'doctorPage' (may be UNDEFINED):"
grep -l "doctorPage" e2e/tests/*.spec.ts | sed 's|e2e/tests/||' | sed 's|.spec.ts||'

echo ""
echo "Tests using 'deliveryPage' (may be UNDEFINED):"
grep -l "deliveryPage" e2e/tests/*.spec.ts | sed 's|e2e/tests/||' | sed 's|.spec.ts||'

echo ""
echo "✅ Available Fixtures (from auth.fixture.ts):"
echo "  - loginPage"
echo "  - authenticatedPage"
echo "  - pharmacistPage"
echo "  - nursePage"

echo ""
echo "❌ Missing Fixtures:"
echo "  - patientPage"
echo "  - doctorPage"
echo "  - deliveryPage"

echo ""
echo "🔧 Backend Authentication Status:"
echo "The global-setup tried to authenticate 4 users but all failed with timeout."
echo "This indicates the backend authentication service is not responding."
