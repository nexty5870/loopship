#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Auto-detect headless: default true if no display available
if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
    HEADLESS=true
else
    HEADLESS=false
fi

# Parse command line arguments (can override auto-detect)
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --headless) HEADLESS=true ;;
        --no-headless) HEADLESS=false ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "Installing dependencies..."
npm install

echo "Starting dev-browser server (headless=$HEADLESS)..."
export HEADLESS=$HEADLESS
npx tsx scripts/start-server.ts
