#!/bin/bash
# Ralph Loop - Autonomous AI coding
# Based on @GeoffreyHuntley's original

set -e

MAX_ITERATIONS=${1:-25}
AGENT=${AGENT:-"claude"}  # claude, amp, codex

echo "🔄 Starting Ralph Loop (max $MAX_ITERATIONS iterations)"
echo "Agent: $AGENT"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔁 Iteration $i/$MAX_ITERATIONS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if all stories are done
    if command -v jq &> /dev/null; then
        REMAINING=$(jq '[.stories[] | select(.passes != true)] | length' prd.json 2>/dev/null || echo "?")
        echo "📋 Stories remaining: $REMAINING"
        
        if [ "$REMAINING" = "0" ]; then
            echo "✅ All stories complete!"
            exit 0
        fi
    fi
    
    # Run the agent with the prompt
    case $AGENT in
        claude)
            cat prompt.md | claude --dangerously-skip-permissions
            ;;
        amp)
            cat prompt.md | amp
            ;;
        codex)
            cat prompt.md | codex
            ;;
        *)
            echo "Unknown agent: $AGENT"
            exit 1
            ;;
    esac
    
    echo ""
    echo "⏳ Waiting 5s before next iteration..."
    sleep 5
done

echo "⚠️ Max iterations reached"
