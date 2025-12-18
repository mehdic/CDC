#!/bin/bash
# inspect-reasoning.sh - Simple version

DB_SCRIPT=".claude/skills/bazinga-db/scripts/bazinga_db.py"

if [ "$1" == "--list" ]; then
    echo "=== Recent Sessions ==="
    python3 "$DB_SCRIPT" --quiet list-sessions 5 | python3 -c "
import json, sys
for s in json.load(sys.stdin):
    icon = '✅' if s.get('status') == 'completed' else '🔄'
    print(f\"{icon} {s['session_id']}  ({s.get('status')})  Mode: {s.get('mode')}\")"
    exit 0
fi

SESSION_ID="${1:-}"
AGENT_FILTER="${2:-}"  # --agent
AGENT_VALUE="${3:-}"   # developer

if [ -z "$SESSION_ID" ]; then
    echo "Usage: $0 <session_id> [--agent <type>] [--full]"
    echo "       $0 --list"
    exit 1
fi

# Handle --agent flag
if [ "$AGENT_FILTER" == "--agent" ]; then
    FILTER="$AGENT_VALUE"
else
    FILTER=""
fi

# Check for --full flag
SHOW_FULL=false
for arg in "$@"; do
    [ "$arg" == "--full" ] && SHOW_FULL=true
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Reasoning Inspector - Session: $SESSION_ID"
echo "════════════════════════════════════════════════════════════"
echo ""

# Write to temp file, then process
python3 "$DB_SCRIPT" --quiet get-reasoning "$SESSION_ID" > /tmp/reasoning_data.json

python3 << PYEOF
import json

with open('/tmp/reasoning_data.json') as f:
    data = json.load(f)

agent_filter = "$FILTER"
show_full = "$SHOW_FULL" == "true"

if not data:
    print("❌ No reasoning entries found")
    exit()

# Filter by agent if specified
if agent_filter:
    data = [r for r in data if r.get('agent_type') == agent_filter]

if not data:
    print(f"❌ No entries for agent: {agent_filter}")
    exit()

icons = {
    'developer': '🔨', 'senior_software_engineer': '🔧',
    'qa_expert': '🧪', 'tech_lead': '👔', 
    'project_manager': '📋', 'investigator': '🔍'
}

phase_icons = {'understanding': '🧠', 'decisions': '🤔', 'completion': '✅'}

print(f"Found {len(data)} entries\n")

for r in sorted(data, key=lambda x: (x.get('agent_type', ''), x.get('timestamp', ''))):
    agent = r.get('agent_type', '?')
    phase = r.get('reasoning_phase', r.get('phase', '?'))
    group = r.get('group_id', 'global')
    confidence = r.get('confidence_level', r.get('confidence', '?'))
    content = r.get('content', '')
    refs = r.get('references', [])
    ts = r.get('timestamp', '')[:19]
    
    icon = icons.get(agent, '👤')
    picon = phase_icons.get(phase, '📄')
    
    print(f"{icon} {agent.upper()} | {picon} {phase} | Group: {group}")
    print(f"   Confidence: {confidence} | Time: {ts}")
    if refs:
        print(f"   Files: {', '.join(refs[:3])}")
    print()
    
    if content:
        lines = content.split('\n')
        if show_full:
            for line in lines:
                print(f"   {line}")
        else:
            for line in lines[:15]:
                print(f"   {line}")
            if len(lines) > 15:
                print(f"   ... ({len(lines)-15} more lines, use --full)")
    print()
    print("─" * 60)

print(f"\nTotal: {len(data)} entries")
PYEOF

