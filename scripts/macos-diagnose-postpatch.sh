#!/usr/bin/env bash
# Capture signing/notarization/quarantine state of Discord.app AFTER 'pnpm inject'.
# Run AFTER user has run 'pnpm inject' on this machine.
set -euo pipefail

OUT_DIR="docs/diagnostics/2026-05-28-sequoia-inject"
DISCORD_APP="/Applications/Discord.app"

mkdir -p "$OUT_DIR"

# Quick check we're post-patch
if [[ ! -f "$DISCORD_APP/Contents/Resources/_app.asar" ]]; then
    echo "ERROR: $DISCORD_APP/Contents/Resources/_app.asar not found." >&2
    echo "Expected Equilotl to have renamed app.asar -> _app.asar. Did 'pnpm inject' run?" >&2
    exit 1
fi

echo "[1/4] codesign -dvvv -> post-patch-codesign.txt"
codesign -dvvv "$DISCORD_APP" > "$OUT_DIR/post-patch-codesign.txt" 2>&1 || true

echo "[2/4] spctl -a -vvv -> post-patch-spctl.txt"
spctl -a -vvv "$DISCORD_APP" > "$OUT_DIR/post-patch-spctl.txt" 2>&1 || true

echo "[3/4] stapler validate -> post-patch-stapler.txt"
stapler validate "$DISCORD_APP" > "$OUT_DIR/post-patch-stapler.txt" 2>&1 || true

echo "[4/4] xattr -lr (first 200 lines) -> post-patch-xattr.txt"
xattr -lr "$DISCORD_APP" 2>&1 | head -200 > "$OUT_DIR/post-patch-xattr.txt" || true

echo
echo "Post-patch captured. Files:"
ls -la "$OUT_DIR/" | grep post-patch-
