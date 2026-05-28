#!/usr/bin/env bash
# Capture signing/notarization/quarantine state of unpatched Discord.app.
# Run BEFORE 'pnpm inject'.
set -euo pipefail

OUT_DIR="docs/diagnostics/2026-05-28-sequoia-inject"
DISCORD_APP="/Applications/Discord.app"
DISCORD_BIN="$DISCORD_APP/Contents/MacOS/Discord"

mkdir -p "$OUT_DIR"

echo "[1/5] codesign -dvvv -> baseline-codesign.txt"
codesign -dvvv "$DISCORD_APP" > "$OUT_DIR/baseline-codesign.txt" 2>&1 || true

echo "[2/5] entitlements -> baseline-entitlements.xml"
codesign -d --entitlements - --xml "$DISCORD_BIN" > "$OUT_DIR/baseline-entitlements.xml" 2>&1 || true

echo "[3/5] spctl -a -vvv -> baseline-spctl.txt"
spctl -a -vvv "$DISCORD_APP" > "$OUT_DIR/baseline-spctl.txt" 2>&1 || true

echo "[4/5] stapler validate -> baseline-stapler.txt"
stapler validate "$DISCORD_APP" > "$OUT_DIR/baseline-stapler.txt" 2>&1 || true

echo "[5/5] xattr -lr (first 200 lines) -> baseline-xattr.txt"
xattr -lr "$DISCORD_APP" 2>&1 | head -200 > "$OUT_DIR/baseline-xattr.txt" || true

echo
echo "Baseline captured. Files:"
ls -la "$OUT_DIR/" | grep baseline-
