#!/usr/bin/env bash
# Verify the Mac is set up correctly to run the Sequoia inject diagnosis.
# Run from the Nyxcord repo root.
set -euo pipefail

OUT_DIR="docs/diagnostics/2026-05-28-sequoia-inject"
DISCORD_APP="/Applications/Discord.app"
EQUICORD_ASAR="dist/desktop/equicord.asar"

mkdir -p "$OUT_DIR"

echo "[1/4] OS version..."
sw_vers | tee "$OUT_DIR/system-info.txt"
MAJOR=$(sw_vers -productVersion | cut -d. -f1)
if [[ "$MAJOR" -lt 15 ]]; then
    echo "WARNING: this Mac is on macOS $MAJOR, not Sequoia 15+. Diagnosis is only meaningful on 15+."
fi

echo "[2/4] Architecture..."
uname -m | tee -a "$OUT_DIR/system-info.txt"

echo "[3/4] Discord.app present at $DISCORD_APP..."
if [[ ! -d "$DISCORD_APP" ]]; then
    echo "ERROR: $DISCORD_APP not found. Download a fresh Discord from https://discord.com/download first." >&2
    exit 1
fi

echo "[4/4] Nyxcord build artifact present at $EQUICORD_ASAR..."
if [[ ! -f "$EQUICORD_ASAR" ]]; then
    echo "ERROR: $EQUICORD_ASAR missing. Run 'pnpm build' first." >&2
    exit 1
fi

echo
echo "Pre-flight OK. Proceed to Task 3."
