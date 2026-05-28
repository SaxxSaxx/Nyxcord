# macOS Sequoia Inject Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Diagnose why fresh-install Nyxcord on macOS Sequoia 15+ produces a "Discord is damaged" dialog, apply the matched fix, and integrate it into `install.sh` so a fresh Mac install just works.

**Architecture:** Three phases — (1) capture diagnostic evidence (baseline, post-patch, launch-time rejection) into `docs/diagnostics/2026-05-28-sequoia-inject/`; (2) classify the rejection against five known failure classes from the spec; (3) execute only the matched fix branch, validate end-to-end, then either integrate the fix into the install path or document Equibop as the supported Mac route.

**Tech Stack:** bash, macOS `codesign`/`spctl`/`stapler`/`log`/`xattr`, pnpm/Node (already in repo), Equilotl Go installer (already integrated via `pnpm inject`).

**User-on-Mac required:** This plan cannot be executed end-to-end by an agent. Many tasks require the user to run commands on their physical Sequoia Mac and commit the captured evidence. Tasks marked `[USER]` need the user; `[CLAUDE]` can be done by the agent from the captured evidence; `[EITHER]` is mechanical and runnable by either.

---

### Task 1: Set up diagnostics workspace `[CLAUDE]`

**Files:**
- Create: `docs/diagnostics/2026-05-28-sequoia-inject/.gitkeep`
- Create: `docs/diagnostics/2026-05-28-sequoia-inject/README.md` (skeleton)

- [ ] **Step 1: Create the directory and placeholder**

```bash
mkdir -p docs/diagnostics/2026-05-28-sequoia-inject
touch docs/diagnostics/2026-05-28-sequoia-inject/.gitkeep
```

- [ ] **Step 2: Write the README skeleton**

Create `docs/diagnostics/2026-05-28-sequoia-inject/README.md`:

```markdown
# macOS Sequoia inject diagnostics — 2026-05-28

Evidence captured to diagnose why a fresh `pnpm inject` produces a
"Discord is damaged" dialog on macOS Sequoia 15+.

See `docs/superpowers/specs/2026-05-28-macos-sequoia-inject-fix-design.md`
for the diagnostic protocol and failure-class taxonomy.

## Files (filled in as tasks complete)

| File | What it shows |
|---|---|
| `system-info.txt` | macOS version + arch |
| `baseline-codesign.txt` | Unpatched Discord.app codesign details |
| `baseline-entitlements.xml` | Unpatched main-executable entitlements |
| `baseline-spctl.txt` | Unpatched Gatekeeper assessment |
| `baseline-stapler.txt` | Unpatched notarization staple status |
| `baseline-xattr.txt` | Unpatched extended attributes |
| `post-patch-codesign.txt` | Post-`pnpm inject` codesign details |
| `post-patch-spctl.txt` | Post-patch Gatekeeper assessment |
| `post-patch-stapler.txt` | Post-patch staple status |
| `post-patch-xattr.txt` | Post-patch xattrs |
| `log-stream-launch.txt` | macOS unified log during failed launch |
| `crash-report.txt` | DiagnosticReports entry from failed launch (if produced) |
| `dialog.png` | Screenshot of the "is damaged" dialog |

## Verdict

_To be filled in by classification task (Task 6)._
```

- [ ] **Step 3: Commit**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/
git commit -m "diagnostics: scaffold sequoia-inject evidence dir"
```

---

### Task 2: Pre-flight script + user-side baseline conditions `[EITHER+USER]`

**Files:**
- Create: `scripts/macos-diagnose-preflight.sh`

- [ ] **Step 1: Write the pre-flight script**

Create `scripts/macos-diagnose-preflight.sh`:

```bash
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
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x scripts/macos-diagnose-preflight.sh
git add scripts/macos-diagnose-preflight.sh
git commit -m "diagnostics: add macOS pre-flight script"
```

- [ ] **Step 3 (USER on Mac): Establish baseline conditions**

User runs on their Sequoia Mac, in the Nyxcord repo root:

```bash
# Verify Sequoia
sw_vers

# Fresh Discord — drag old Discord.app to Trash, download from https://discord.com/download,
# move to /Applications/. Open Discord once, log in, then quit it cleanly.

# Build Nyxcord
pnpm install
pnpm build

# Run pre-flight
bash scripts/macos-diagnose-preflight.sh
```

Expected: pre-flight prints "Pre-flight OK".

- [ ] **Step 4 (USER): Commit captured system-info**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/system-info.txt
git commit -m "diagnostics: capture Mac system info"
```

---

### Task 3: Capture baseline (unpatched Discord) state `[EITHER+USER]`

**Files:**
- Create: `scripts/macos-diagnose-baseline.sh`

- [ ] **Step 1: Write the baseline-capture script**

Create `scripts/macos-diagnose-baseline.sh`:

```bash
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
```

- [ ] **Step 2: Make executable and commit script**

```bash
chmod +x scripts/macos-diagnose-baseline.sh
git add scripts/macos-diagnose-baseline.sh
git commit -m "diagnostics: add baseline capture script"
```

- [ ] **Step 3 (USER on Mac): Run baseline capture**

```bash
bash scripts/macos-diagnose-baseline.sh
```

Expected: 5 baseline-*.txt/xml files in `docs/diagnostics/2026-05-28-sequoia-inject/`.

- [ ] **Step 4 (USER): Sanity-check Discord launches unpatched**

```bash
open /Applications/Discord.app
```

Expected: Discord launches normally. Quit it.

- [ ] **Step 5 (USER): Commit captured baseline**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/baseline-*
git commit -m "diagnostics: capture unpatched Discord baseline"
```

---

### Task 4: Apply patch and capture post-patch state `[EITHER+USER]`

**Files:**
- Create: `scripts/macos-diagnose-postpatch.sh`

- [ ] **Step 1: Write post-patch capture script**

Create `scripts/macos-diagnose-postpatch.sh`:

```bash
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
```

- [ ] **Step 2: Make executable and commit script**

```bash
chmod +x scripts/macos-diagnose-postpatch.sh
git add scripts/macos-diagnose-postpatch.sh
git commit -m "diagnostics: add post-patch capture script"
```

- [ ] **Step 3 (USER on Mac): Apply patch**

```bash
pnpm inject
```

Expected: Equilotl reports successful patch. Discord NOT yet launched.

- [ ] **Step 4 (USER): Capture post-patch state**

```bash
bash scripts/macos-diagnose-postpatch.sh
```

Expected: 4 post-patch-* files in `docs/diagnostics/2026-05-28-sequoia-inject/`.

- [ ] **Step 5 (USER): Commit captured post-patch state**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/post-patch-*
git commit -m "diagnostics: capture post-patch Discord state"
```

---

### Task 5: Diagnostic launch — capture rejection in real time `[EITHER+USER]`

**Files:**
- Create: `scripts/macos-diagnose-launch.sh`

- [ ] **Step 1: Write diagnostic-launch script**

Create `scripts/macos-diagnose-launch.sh`:

```bash
#!/usr/bin/env bash
# Capture the macOS unified log + crash report from a failed launch of patched Discord.
# Streams 'log' in background while opening Discord, then collects crash report if any.
set -euo pipefail

OUT_DIR="docs/diagnostics/2026-05-28-sequoia-inject"
DISCORD_APP="/Applications/Discord.app"
LOG_FILE="$OUT_DIR/log-stream-launch.txt"
CRASH_OUT="$OUT_DIR/crash-report.txt"

mkdir -p "$OUT_DIR"

# NOTE: AMFI/kernel messages on Sequoia with SIP enabled may require sudo.
# If log-stream-launch.txt shows no AMFI or syspolicy lines after the run,
# re-run this script with: sudo bash scripts/macos-diagnose-launch.sh
echo "NOTE: if log-stream-launch.txt has no AMFI/syspolicy lines, re-run with: sudo bash scripts/macos-diagnose-launch.sh"

echo "Starting log stream (10s window)..."
# Filter on AMFI, syspolicy, taskgated, and any message mentioning Discord.
log stream \
    --predicate '(composedMessage CONTAINS[c] "Discord") OR (subsystem CONTAINS[c] "amfi") OR (subsystem CONTAINS[c] "syspolicy") OR (subsystem CONTAINS[c] "taskgated")' \
    --level debug \
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
```

- [ ] **Step 2: Make executable and commit script**

```bash
chmod +x scripts/macos-diagnose-launch.sh
git add scripts/macos-diagnose-launch.sh
git commit -m "diagnostics: add diagnostic-launch script"
```

- [ ] **Step 3 (USER on Mac): Run diagnostic launch**

```bash
bash scripts/macos-diagnose-launch.sh
```

Expected: `log-stream-launch.txt` populated, `crash-report.txt` either has a real crash or the "no crash report" note, the "is damaged" dialog appears on screen.

- [ ] **Step 4 (USER): Screenshot the dialog**

Press Cmd+Shift+4, drag a box over the "Discord is damaged" dialog, then move the resulting screenshot file to `docs/diagnostics/2026-05-28-sequoia-inject/dialog.png`. Dismiss the dialog.

- [ ] **Step 5 (USER): Commit all launch evidence**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/log-stream-launch.txt \
        docs/diagnostics/2026-05-28-sequoia-inject/crash-report.txt \
        docs/diagnostics/2026-05-28-sequoia-inject/dialog.png
git commit -m "diagnostics: capture failed-launch log + crash + dialog"
```

User then pings Claude: "diagnostic evidence committed — please classify."

---

### Task 6: Classify rejection class `[CLAUDE]`

**Files:**
- Modify: `docs/diagnostics/2026-05-28-sequoia-inject/README.md` (fill in "Verdict")

- [ ] **Step 1: Pull and read all captured evidence**

```bash
git pull
```

Then Claude reads:
- `docs/diagnostics/2026-05-28-sequoia-inject/baseline-*`
- `docs/diagnostics/2026-05-28-sequoia-inject/post-patch-*`
- `docs/diagnostics/2026-05-28-sequoia-inject/log-stream-launch.txt`
- `docs/diagnostics/2026-05-28-sequoia-inject/crash-report.txt`

- [ ] **Step 2: Match evidence to a failure class**

Apply the taxonomy from the spec (section "Failure-class taxonomy & decision tree"):

| Class | Look for in log-stream-launch.txt |
|---|---|
| 1. AMFI bundle-sig | `AMFI: ... code signature in <...> not valid` OR `Killing process: code signing problem` |
| 2. Library Validation | `Library Validation failed: Rejecting '<dylib>'` OR `dyld: library load disallowed by system policy` |
| 3. Notarization staple | `syspolicyd: ... staple invalid` AND no AMFI message |
| 4. Translocation / quarantine | `xattr` shows `com.apple.quarantine` OR `/AppTranslocation/` path |
| 5. None of the above | none of the signatures match |

- [ ] **Step 3: Update the diagnostics README with the verdict**

In `docs/diagnostics/2026-05-28-sequoia-inject/README.md`, replace the "Verdict" section with:

```markdown
## Verdict

**Matched class:** [1/2/3/4/5]

**Evidence:**
- [quote 1-3 specific log lines that point to this class, with file:line references]

**Recommended fix branch:** Task 7[a/b/c/d/e].

**Confidence:** [high/medium/low — and why if not high]
```

- [ ] **Step 4: Commit the verdict**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/README.md
git commit -m "diagnostics: classify rejection as Class N — <name>"
git push
```

User then pulls and proceeds to the matched Task 7 branch.

---

### Task 7a — Fix branch: Class 1 (AMFI bundle-signature) `[EITHER+USER]`

**Execute only if Task 6 verdict = Class 1.**

**Files:**
- Create: `scripts/macos-sign.sh` (initial draft for this class)

- [ ] **Step 1: Write the class-1 fix script**

Create `scripts/macos-sign.sh`:

```bash
#!/usr/bin/env bash
# Class 1 fix: AMFI bundle-signature rejection on Sequoia.
# Strips broken signature and re-signs ad-hoc with original entitlements preserved.
set -euo pipefail

DISCORD_APP="${1:-/Applications/Discord.app}"
ENTITLEMENTS="${2:-docs/diagnostics/2026-05-28-sequoia-inject/baseline-entitlements.xml}"

if [[ ! -d "$DISCORD_APP" ]]; then
    echo "ERROR: $DISCORD_APP not found" >&2; exit 1
fi
if [[ ! -f "$ENTITLEMENTS" ]]; then
    echo "ERROR: entitlements file $ENTITLEMENTS not found" >&2; exit 1
fi

echo "Removing existing signature..."
codesign --remove-signature "$DISCORD_APP"

echo "Re-signing ad-hoc with preserved entitlements..."
codesign --force --deep --sign - \
    --entitlements "$ENTITLEMENTS" \
    "$DISCORD_APP"

echo "Verifying signature..."
codesign --verify --verbose "$DISCORD_APP"

echo
echo "Done. Launch Discord to test."
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x scripts/macos-sign.sh
git add scripts/macos-sign.sh
git commit -m "macos: add Class 1 (AMFI) fix script"
```

- [ ] **Step 3 (USER on Mac): Run the fix**

```bash
bash scripts/macos-sign.sh
```

Expected: "Verifying signature..." reports success. No errors.

- [ ] **Step 4: Jump to Task 8 (acceptance tests)**

---

### Task 7b — Fix branch: Class 2 (Library Validation) `[EITHER+USER]` ⭐ most likely

**Execute only if Task 6 verdict = Class 2.**

**Files:**
- Create: `scripts/macos-entitlements.plist`
- Create: `scripts/macos-sign.sh`

- [ ] **Step 1: Write the entitlements plist**

Create `scripts/macos-entitlements.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.cs.disable-executable-page-protection</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
</dict>
</plist>
```

- [ ] **Step 2: Write the class-2 fix script**

Create `scripts/macos-sign.sh`:

```bash
#!/usr/bin/env bash
# Class 2 fix: Library Validation rejection on Sequoia.
# Re-signs Discord.app with Hardened Runtime escape-hatch entitlements
# so the patched app.asar loader can run alongside Discord's signed dylibs.
set -euo pipefail

DISCORD_APP="${1:-/Applications/Discord.app}"
ENTITLEMENTS="${2:-scripts/macos-entitlements.plist}"

if [[ ! -d "$DISCORD_APP" ]]; then
    echo "ERROR: $DISCORD_APP not found" >&2; exit 1
fi
if [[ ! -f "$ENTITLEMENTS" ]]; then
    echo "ERROR: entitlements file $ENTITLEMENTS not found" >&2; exit 1
fi

echo "Removing existing signature..."
codesign --remove-signature "$DISCORD_APP"

echo "Re-signing ad-hoc with Library Validation disabled..."
codesign --force --deep --sign - \
    --options runtime \
    --entitlements "$ENTITLEMENTS" \
    "$DISCORD_APP"

echo "Verifying signature..."
codesign --verify --verbose "$DISCORD_APP"

echo
echo "Done. Launch Discord to test."
```

- [ ] **Step 3: Make executable and commit**

```bash
chmod +x scripts/macos-sign.sh
git add scripts/macos-sign.sh scripts/macos-entitlements.plist
git commit -m "macos: add Class 2 (Library Validation) fix + entitlements"
```

- [ ] **Step 4 (USER on Mac): Run the fix**

```bash
bash scripts/macos-sign.sh
```

Expected: "Verifying signature..." reports success.

- [ ] **Step 5: Jump to Task 8 (acceptance tests)**

---

### Task 7c — Fix branch: Class 3 (Notarization staple) `[EITHER+USER]`

**Execute only if Task 6 verdict = Class 3.**

**Files:**
- Create: `scripts/macos-sign.sh`

- [ ] **Step 1: Write the class-3 fix script**

Create `scripts/macos-sign.sh`:

```bash
#!/usr/bin/env bash
# Class 3 fix: notarization staple invalid after patch.
# Strips the staple, clears quarantine, re-signs ad-hoc WITHOUT hardened runtime.
set -euo pipefail

DISCORD_APP="${1:-/Applications/Discord.app}"

if [[ ! -d "$DISCORD_APP" ]]; then
    echo "ERROR: $DISCORD_APP not found" >&2; exit 1
fi

echo "Erasing notarization staple..."
stapler erase "$DISCORD_APP" || true

echo "Clearing quarantine + other xattrs recursively..."
xattr -cr "$DISCORD_APP"

echo "Removing existing signature..."
codesign --remove-signature "$DISCORD_APP"

echo "Re-signing ad-hoc without hardened runtime..."
codesign --force --deep --sign - "$DISCORD_APP"

echo "Verifying signature..."
codesign --verify --verbose "$DISCORD_APP"

echo
echo "Done. Launch Discord to test."
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x scripts/macos-sign.sh
git add scripts/macos-sign.sh
git commit -m "macos: add Class 3 (notarization staple) fix script"
```

- [ ] **Step 3 (USER on Mac): Run the fix**

```bash
bash scripts/macos-sign.sh
```

Expected: "Verifying signature..." reports success.

- [ ] **Step 4: Jump to Task 8 (acceptance tests)**

---

### Task 7d — Fix branch: Class 4 (Translocation / quarantine) `[USER]`

**Execute only if Task 6 verdict = Class 4 — or pre-clear before any other branch.**

- [ ] **Step 1 (USER on Mac): Clear quarantine and translocation**

```bash
xattr -dr com.apple.quarantine /Applications/Discord.app
xattr -dr com.apple.provenance /Applications/Discord.app 2>/dev/null || true

# If Discord launched from /private/var/folders/.../AppTranslocation/ in the log,
# copy it to /Applications/ to break translocation:
cp -R /Applications/Discord.app /tmp/Discord.app
rm -rf /Applications/Discord.app
mv /tmp/Discord.app /Applications/Discord.app
xattr -dr com.apple.quarantine /Applications/Discord.app
```

- [ ] **Step 2: Jump to Task 8 (acceptance tests)**

If acceptance fails, this likely means quarantine wasn't the sole cause — re-run Task 6 classification on the now-clean state. The other diagnostic outputs may now point clearly to class 1, 2, or 3.

---

### Task 7e — Fix branch: Class 5 (catch-all / dead-end) `[CLAUDE+USER]`

**Execute only if Task 6 verdict = Class 5, or after a second fix branch fails per the spec's time-box.**

This is the documented exit — pivot to Equibop as the supported Mac path.

**Files:**
- Create: `docs/macos-sequoia-status.md`
- Modify: `install.sh` (add darwin branch with informative exit)
- Modify: `README.md` (Mac install section → Equibop)

- [ ] **Step 1: Write the status document**

Create `docs/macos-sequoia-status.md`:

```markdown
# macOS Sequoia inject — status

**Last attempted:** 2026-05-28
**Status:** Unsupported. Use Equibop on Mac.

## What we tried

[Claude fills in: summary of the captured diagnostic evidence,
which classes were tested, what each fix attempt produced.]

## Why we stopped

[Claude fills in: which rejection class(es) we matched, why the
documented fix branch didn't unblock launch, what we'd need to
try next if/when we revisit.]

## Supported Mac path

Use Equibop. See README "macOS install" section.

## Future revival path

[Claude lists concrete next steps a future session could try:
e.g., real Apple Developer cert + notarization, alternative
injection mechanism via DYLD_INSERT_LIBRARIES, etc.]
```

- [ ] **Step 2: Modify `install.sh` to add a darwin branch**

In `install.sh`, after the `pnpm build` line and before `pnpm inject`, insert:

```bash
if [[ "$(uname)" == "Darwin" ]]; then
    MAJOR=$(sw_vers -productVersion | cut -d. -f1)
    if [[ "$MAJOR" -ge 15 ]]; then
        cat <<'MSG'

==========================================================================
macOS Sequoia (15+) note:
  Direct Discord.app patching is not currently supported on Sequoia.
  Please use Equibop instead — see "macOS install" in README.md.
  Exiting without patching.
==========================================================================
MSG
        exit 0
    fi
fi
```

- [ ] **Step 3: Modify `README.md` — "macOS install" section**

Replace whatever "macOS install" content exists (or add the section if missing) with:

```markdown
## macOS install

**macOS Sequoia 15+:** Direct Discord.app patching is not currently supported on Sequoia. Use Equibop:

1. Build Equibop locally: `pnpm install && pnpm build && pnpm buildStandalone`
2. The Equibop app appears in `dist/equibop/`. Move it to `/Applications/`.
3. Launch Equibop instead of Discord; Nyxcord is built in.

See `docs/macos-sequoia-status.md` for details on why direct patching is blocked.

**macOS 14 and earlier:** Standard install works: `bash install.sh`.
```

- [ ] **Step 4: Commit dead-end pivot**

```bash
git add docs/macos-sequoia-status.md install.sh README.md
git commit -m "macos: pivot Mac install to Equibop on Sequoia 15+

Diagnosis from docs/diagnostics/2026-05-28-sequoia-inject/ did not
yield a fix for fresh-install Discord.app on Sequoia. install.sh
now refuses to patch on Sequoia and points users to Equibop.
"
```

- [ ] **Step 5: Skip Tasks 8–11. Plan complete (dead-end path).**

---

### Task 8: Acceptance test sequence `[USER]`

**Run after any of Task 7a / 7b / 7c / 7d.**

All five sub-steps must pass before declaring the fix working. If any fail, re-classify (Task 6) and try the next-most-likely Task 7 branch — max 2 fix branches total per the spec.

- [ ] **Step 1: Discord launches without "damaged" dialog**

```bash
open /Applications/Discord.app
```

Expected: Discord window appears, login screen or message list. No "is damaged" dialog.

- [ ] **Step 2: Nyxcord settings panel visible inside Discord**

In Discord, click the user gear icon → scroll the left sidebar. Look for "Nyxcord" entry (purple `#a855f7` accent).

Expected: "Nyxcord" settings section is present, clickable, shows the plugin grid.

- [ ] **Step 3: Quit and relaunch — still launches**

Cmd+Q to quit, then `open /Applications/Discord.app`.

Expected: launches cleanly again.

- [ ] **Step 4: Reboot and relaunch — still launches**

Reboot the Mac (Apple menu → Restart). After login, launch Discord.

Expected: launches cleanly. (This catches kernel-cached signing decisions that mask failure on fresh boot.)

- [ ] **Step 5: Round-trip uninject/reinject works**

```bash
pnpm uninject
open /Applications/Discord.app       # should launch as plain Discord, no Nyxcord
# quit Discord
pnpm inject
bash scripts/macos-sign.sh           # re-apply the matched fix
open /Applications/Discord.app       # should launch with Nyxcord again
```

Expected: each `open` results in a clean launch matching the expected state (plain or Nyxcord-loaded).

- [ ] **Step 6: Report result to Claude**

Reply: "acceptance pass — proceed to Task 9" or "acceptance failed at step N — log: ..." 

If failed, Claude re-classifies. If second branch also fails, jump to Task 7e (dead-end).

---

### Task 9: Integrate fix into install.sh `[CLAUDE]`

**Execute only after Task 8 passes.**

**Files:**
- Modify: `install.sh`

- [ ] **Step 1: Add darwin branch that calls macos-sign.sh after pnpm inject**

In `install.sh`, replace the final `pnpm inject` block with:

```bash
pnpm inject

if [[ "$(uname)" == "Darwin" ]]; then
    MAJOR=$(sw_vers -productVersion | cut -d. -f1)
    if [[ "$MAJOR" -ge 15 ]]; then
        echo
        echo "macOS Sequoia detected — applying signing fix..."
        bash scripts/macos-sign.sh
    fi
fi
```

- [ ] **Step 2: Commit**

```bash
git add install.sh
git commit -m "install.sh: apply Sequoia signing fix on darwin"
```

---

### Task 10: Update README with macOS install instructions `[CLAUDE]`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update or add "macOS install" section**

In `README.md`, in or near the install section, ensure a "macOS install" subsection exists with:

```markdown
## macOS install

**Supported:** macOS Sequoia 15+ (Intel + Apple Silicon).

1. Download a fresh Discord.app from https://discord.com/download and move to `/Applications/`.
2. Launch Discord once and quit it cleanly.
3. From the Nyxcord repo root:
   ```
   pnpm install
   pnpm build
   bash install.sh
   ```
4. The installer applies a Sequoia-specific signing fix automatically. Relaunch Discord — Nyxcord should be loaded (look for "Nyxcord" in Discord settings).

**Why the extra signing step?** macOS Sequoia tightened code-signature enforcement. Patching `app.asar` invalidates Discord's original signature, so Nyxcord re-signs the bundle ad-hoc post-patch. See `docs/diagnostics/2026-05-28-sequoia-inject/README.md` for the technical details.

**To uninstall:** `pnpm uninject`. Discord returns to its original state on next launch.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "README: document macOS Sequoia install path"
```

---

### Task 11: Finalize diagnostics writeup `[CLAUDE]`

**Files:**
- Modify: `docs/diagnostics/2026-05-28-sequoia-inject/README.md`

- [ ] **Step 1: Expand the README with the resolution**

Append to the existing diagnostics README:

```markdown
## Resolution

**Matched class:** [N — name]

**Fix applied:** [1-3 sentences describing the matched Task 7 branch and what specific commands resolved the rejection.]

**Why it works:** [1-2 sentences explaining the underlying macOS mechanism the fix addresses, in plain terms.]

**Integration:** Fix lives in `scripts/macos-sign.sh` and is called from `install.sh` on `darwin` with major version >= 15. Entitlements (if class 2) live in `scripts/macos-entitlements.plist`.

**Possible upstream contribution:** [Note whether this fix is general enough to upstream to Equilotl/VencordInstaller, and what would block such a PR (e.g., needs cross-arch testing, needs broader signing strategy, etc.).]
```

- [ ] **Step 2: Commit + push**

```bash
git add docs/diagnostics/2026-05-28-sequoia-inject/README.md
git commit -m "diagnostics: finalize sequoia-inject resolution writeup"
git push origin main
```

(Push is required here so Task 12's smoke test, which pulls `install.sh` from GitHub, sees the new darwin branch and signing fix.)

---

### Task 12: Smoke-test the integrated install.sh `[USER]`

- [ ] **Step 1 (USER on Mac): Fresh-install dry-run**

```bash
# Restore Discord to pristine
pnpm uninject
rm -rf /Applications/Discord.app
# Download fresh Discord.app from https://discord.com/download, drag to /Applications/

# Wipe Nyxcord install too (optional, to test install.sh from scratch)
rm -rf ~/.nyxcord

# Run the installer the way a real user would
curl -fsSL https://raw.githubusercontent.com/SaxxSaxx/Nyxcord/main/install.sh | bash
```

Expected: installer completes; Discord launches with Nyxcord loaded. No manual steps required.

- [ ] **Step 2: Report**

Reply "smoke test pass" or "smoke test failed: [details]". If failure, may need a follow-up fix commit.

---

### Task 13: Tag v0.2.0 release `[USER]`

**Execute only after Task 12 passes.**

- [ ] **Step 1 (USER): Tag and release**

```bash
git tag -a v0.2.0 -m "v0.2.0: macOS Sequoia inject support"
git push origin v0.2.0
```

- [ ] **Step 2 (USER): Build + upload release artifacts manually**

(GitHub Actions auto-fire is a separate spec; for now use the existing manual recipe.)

```bash
pnpm build
tar czf nyxcord-v0.2.0.tar.gz dist/
gh release create v0.2.0 nyxcord-v0.2.0.tar.gz \
    --title "v0.2.0 — macOS Sequoia support" \
    --notes "Adds Sequoia 15+ install path with automatic post-patch signing. See README for install. Linux/Windows unchanged."
```

- [ ] **Step 3: Update project memory**

Ask Claude to update `~/.claude/projects/-Users-andrejpokorny/memory/project_nyxcord.md` with v0.2.0 ship date and resolution status.

---

## Self-review notes

- All 5 failure classes from the spec have a matching Task 7 branch.
- Acceptance test sequence in Task 8 mirrors the spec's 5-step acceptance criteria exactly.
- Dead-end path (Task 7e) produces all three artifacts the spec lists: `macos-sequoia-status.md`, `install.sh` darwin branch, README Equibop pointer.
- Success path produces all four artifacts the spec lists: `scripts/macos-sign.sh`, `scripts/macos-entitlements.plist` (class 2 only), `install.sh` darwin branch, README update, diagnostics README.
- All scripts use `set -euo pipefail`, exact file paths, no placeholders.
- `[USER]` / `[CLAUDE]` / `[EITHER]` tags on every task make the agent/user split unambiguous.
