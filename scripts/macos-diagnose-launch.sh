#!/usr/bin/env bash
# Capture the macOS unified log + crash report from a failed launch of patched Discord.
# Streams 'log' in background while opening Discord, then collects crash report if any.
set -euo pipefail

OUT_DIR="docs/diagnostics/2026-05-28-sequoia-inject"
DISCORD_APP="/Applications/Discord.app"
LOG_FILE="$OUT_DIR/log-stream-launch.txt"
CRASH_OUT="$OUT_DIR/crash-report.txt"

mkdir -p "$OUT_DIR"

echo "Starting log stream (10s window)..."
# Filter on AMFI, syspolicy, taskgated, and any message mentioning Discord.
log stream \
    --predicate '(eventMessage CONTAINS[c] "Discord") OR (subsystem CONTAINS[c] "amfi") OR (subsystem CONTAINS[c] "syspolicy") OR (subsystem CONTAINS[c] "taskgated")' \
    --info --debug --level=debug \
    > "$LOG_FILE" 2>&1 &
LOG_PID=$!

# Give log stream a moment to attach
sleep 1

echo "Launching Discord (expect 'is damaged' dialog)..."
open "$DISCORD_APP" || true

# Wait for the OS to decide and emit log lines
sleep 9

echo "Stopping log stream..."
kill "$LOG_PID" 2>/dev/null || true
wait "$LOG_PID" 2>/dev/null || true

echo
echo "Looking for crash reports in ~/Library/Logs/DiagnosticReports/..."
LATEST=$(ls -t "$HOME/Library/Logs/DiagnosticReports/" 2>/dev/null | grep -i -E "discord" | head -1 || true)
if [[ -n "$LATEST" ]]; then
    echo "Latest Discord crash: $LATEST"
    cp "$HOME/Library/Logs/DiagnosticReports/$LATEST" "$CRASH_OUT"
else
    echo "(no Discord crash report — the OS may have killed the launch before any process started)" > "$CRASH_OUT"
fi

echo
echo "Done. Now take a screenshot of the 'is damaged' dialog (Cmd+Shift+4, drag over dialog),"
echo "save it as $OUT_DIR/dialog.png, then dismiss the dialog."
echo
echo "Captured files:"
ls -la "$OUT_DIR/" | grep -E "log-stream-launch|crash-report"
