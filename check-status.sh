#!/bin/bash
# Save this as: check-specialization-flow.sh
# Run from your CDC project root

echo "=========================================="
echo "BAZINGA Specialization Flow Diagnostic"
echo "=========================================="
echo ""

# 1. Check project_context.json
echo "1. Checking project_context.json..."
if [ -f "bazinga/project_context.json" ]; then
    echo "   ✅ EXISTS"
    echo "   Content preview:"
    head -20 bazinga/project_context.json | sed 's/^/      /'
else
    echo "   ❌ MISSING - Tech Stack Scout should have created this!"
fi
echo ""

# 2. Check skills_config.json for specializations enabled
echo "2. Checking specializations enabled in skills_config.json..."
if [ -f "bazinga/skills_config.json" ]; then
    echo "   File exists. Checking specializations.enabled:"
    grep -A5 '"specializations"' bazinga/skills_config.json | head -10 | sed 's/^/      /'
else
    echo "   ❌ skills_config.json MISSING"
fi
echo ""

# 3. Check if database exists and has task groups with specializations
echo "3. Checking database for task groups with specializations..."
if [ -f "bazinga/bazinga.db" ]; then
    echo "   Database exists. Checking task_groups table:"
    python3 -c "
import sqlite3
import json
conn = sqlite3.connect('bazinga/bazinga.db')
cursor = conn.cursor()
try:
    cursor.execute('SELECT group_id, name, specializations FROM task_groups ORDER BY created_at DESC LIMIT 5')
    rows = cursor.fetchall()
    if rows:
        print('   Recent task groups:')
        for row in rows:
            specs = row[2] if row[2] else 'NULL'
            print(f'      Group: {row[0]} | Name: {row[1][:30]}... | Specializations: {specs}')
    else:
        print('   No task groups found in database')
except Exception as e:
    print(f'   Error querying: {e}')
conn.close()
" 2>/dev/null || echo "   ❌ Could not query database"
else
    echo "   ❌ Database not found at bazinga/bazinga.db"
fi
echo ""

# 4. Check if specialization templates exist
echo "4. Checking specialization templates..."
if [ -d "bazinga/templates/specializations" ]; then
    echo "   ✅ Templates directory exists"
    echo "   Available categories:"
    ls -d bazinga/templates/specializations/*/ 2>/dev/null | sed 's/^/      /'
    echo "   Total templates:"
    find bazinga/templates/specializations -name "*.md" | wc -l | sed 's/^/      /'
else
    echo "   ❌ Templates directory MISSING at bazinga/templates/specializations/"
fi
echo ""

# 5. Check orchestrator.md has Step 0.5
echo "5. Checking orchestrator has Step 0.5 (Tech Stack Scout)..."
if [ -f "agents/orchestrator.md" ]; then
    if grep -q "Step 0.5" agents/orchestrator.md; then
        echo "   ✅ Step 0.5 exists in orchestrator.md"
    else
        echo "   ❌ Step 0.5 NOT FOUND in orchestrator.md"
    fi
else
    echo "   ❌ agents/orchestrator.md not found"
fi
echo ""

# 6. Check PM has Step 3.5 (assign specializations)
echo "6. Checking PM has Step 3.5 (assign specializations)..."
if [ -f "agents/project_manager.md" ]; then
    if grep -q "Step 3.5" agents/project_manager.md; then
        echo "   ✅ Step 3.5 exists in project_manager.md"
    else
        echo "   ❌ Step 3.5 NOT FOUND in project_manager.md"
    fi
else
    echo "   ❌ agents/project_manager.md not found"
fi
echo ""

# 7. Check prompt_building.md has specialization section
echo "7. Checking prompt_building.md has specialization loading..."
if [ -f "bazinga/templates/prompt_building.md" ]; then
    if grep -q "specialization-loader" bazinga/templates/prompt_building.md; then
        echo "   ✅ specialization-loader skill referenced"
    else
        echo "   ❌ specialization-loader NOT referenced"
    fi
else
    echo "   ❌ prompt_building.md not found"
fi
echo ""

echo "=========================================="
echo "DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""
echo "If project_context.json is MISSING:"
echo "  → Tech Stack Scout (Step 0.5) didn't run or failed"
echo "  → PM couldn't assign specialization paths"
echo "  → Orchestrator falls back to inline text"
echo ""
echo "If project_context.json EXISTS but task_groups have NULL specializations:"
echo "  → PM Step 3.5 isn't assigning paths correctly"
echo ""
echo "If task_groups have specializations but prompts don't show skill output:"
echo "  → Orchestrator isn't following prompt_building.md"
echo "  → Or specialization-loader skill isn't being invoked"

