# macOS Sequoia inject fix — design

**Date:** 2026-05-28
**Project:** Nyxcord (v0.2 stability track)
**Status:** Design — awaiting implementation plan

## Context

Nyxcord v0.1.2 ships and works on Linux and Windows. On macOS Sequoia (15+), a fresh `pnpm inject` patches `app.asar` cleanly but the patched Discord.app refuses to launch with a "Discord is damaged" dialog.

Equilotl (the Go installer Nyxcord delegates to via `pnpm inject`, forked from VencordInstaller) does **not** re-sign Discord.app after replacing `app.asar`. Pre-Sequoia, macOS tolerated the now-mismatched signature; Sequoia does not. The upstream Vencord family has not solved this — their de-facto answer is "use Vesktop" (a standalone Electron client, equivalent to our Equibop build).

User chose to attempt original diagnostic work rather than pivot to Equibop. If Nyxcord cracks this, it becomes the only Vencord-family client that works on fresh Sequoia installs — a real differentiator. If we hit a dead-end, Equibop becomes the documented Mac path.

User already tried (per prior session notes): `xattr -cr`, `codesign --force --sign -`, `codesign --force --deep --sign -`, stripping `embedded.provisionprofile`, stripping `_CodeSignature` and ad-hoc resigning. None worked. The key untried piece is **diagnosing the exact rejection class first** rather than blind-firing fixes.

## Goal

A fresh-install Nyxcord launches and loads on macOS Sequoia 15+ via `bash install.sh`, reproducibly, with `pnpm uninject` cleanly reversing the change.

## Success criteria

- Fresh-install path on Sequoia: download Discord.app → `bash install.sh` → relaunch Discord → Nyxcord settings panel visible. Zero "damaged" dialog.
- Reproducible from a clean Mac (or from a documented "reset to baseline" command).
- `pnpm uninject` cleanly restores Discord to a launchable state.
- A stranger on Sequoia can follow the README and end up with a working install.

## Failure / dead-end criterion

If diagnosis + matched fix branch + one follow-up branch attempt all fail to produce a launching Discord, stop. Write findings to `docs/macos-sequoia-status.md`, document Equibop as the supported Mac path in README, exit cleanly with informative message from `install.sh` on darwin. Time-box: one focused diagnostic session + one fix-attempt session. No third session.

## Diagnostic procedure

Capture baseline (unpatched Discord launches fine), post-patch state (Sequoia rejects), and the rejection itself in real time. All evidence committed under `docs/diagnostics/2026-05-28-sequoia-inject/`.

### A. Pre-flight

- `sw_vers` → record macOS version (must be 15.x; abort with note if not).
- Download fresh Discord.app from discord.com into `/Applications/`.
- `pnpm build` so `dist/desktop/equicord.asar` exists.

### B. Baseline capture (unpatched Discord)

| Command | Output file |
|---|---|
| `codesign -dvvv /Applications/Discord.app 2>&1` | `baseline-codesign.txt` |
| `codesign -d --entitlements - --xml /Applications/Discord.app/Contents/MacOS/Discord` | `baseline-entitlements.xml` |
| `spctl -a -vvv /Applications/Discord.app 2>&1` | `baseline-spctl.txt` |
| `stapler validate /Applications/Discord.app 2>&1` | `baseline-stapler.txt` |
| `xattr -lr /Applications/Discord.app \| head -50` | `baseline-xattr.txt` |

Launch Discord, confirm it works → baseline OK.

### C. Apply patch

- `pnpm inject` (runs Equilotl, swaps `app.asar`).
- Re-run B's commands against patched bundle → `post-patch-*.txt`. Signature mismatch expected — capturing how it differs is the data.

### D. Diagnostic launch (capture rejection)

- **Terminal 1:** `log stream --predicate '(eventMessage CONTAINS[c] "Discord") OR (subsystem CONTAINS[c] "amfi") OR (subsystem CONTAINS[c] "syspolicy") OR (subsystem CONTAINS[c] "taskgated")' --info --debug --level=debug` → `log-stream-launch.txt`.
- **Terminal 2:** `open /Applications/Discord.app` then screenshot the dialog → `dialog.png`.
- After dialog appears: copy newest `~/Library/Logs/DiagnosticReports/Discord_*.{crash,ips}` → `crash-report.txt`.

### Deliverable from diagnosis

`docs/diagnostics/2026-05-28-sequoia-inject/README.md` — summarizes what each file shows and which failure class (section below) the evidence points to.

## Failure-class taxonomy & decision tree

Five classes cover the likely Sequoia rejection modes. Match evidence to one class, apply that branch only.

### Class 1 — AMFI bundle-signature rejection

- **Giveaway:** `log stream` shows `AMFI: ... code signature in <...> not valid` or `Killing process: code signing problem with main executable`.
- **Fix:** Strip broken signature, re-sign ad-hoc with original entitlements preserved.
  ```
  codesign --remove-signature /Applications/Discord.app
  codesign --force --deep --sign - \
    --entitlements baseline-entitlements.xml \
    /Applications/Discord.app
  ```
- **Risk:** Preserved entitlements may include team-id-pinned ones that ad-hoc signing can't satisfy. May need a stripped-down variant.

### Class 2 — Library Validation rejection

- **Giveaway:** `Library Validation failed: Rejecting '<dylib>' (Team ID ...)` or `dyld: library load disallowed by system policy`.
- **Fix:** Re-sign with an entitlements plist that adds:
  ```xml
  <key>com.apple.security.cs.disable-library-validation</key><true/>
  <key>com.apple.security.cs.disable-executable-page-protection</key><true/>
  ```
- **Risk:** Highest-confidence fix per Apple docs — this is the published escape hatch for loading foreign code into a hardened-runtime app. Probable winner.

### Class 3 — Notarization staple rejection

- **Giveaway:** `syspolicyd: ... staple invalid` or "is damaged" dialog with no AMFI message in the log.
- **Fix:**
  ```
  stapler erase /Applications/Discord.app
  xattr -cr /Applications/Discord.app
  codesign --force --deep --sign - /Applications/Discord.app   # no --options runtime
  ```
- **Risk:** If Sequoia requires the staple regardless, this won't unblock — escalates to class 2 territory.

### Class 4 — App Translocation / quarantine

- **Giveaway:** `xattr` shows `com.apple.quarantine`, or process running from `/private/var/folders/.../AppTranslocation/...`.
- **Fix:** `xattr -dr com.apple.quarantine /Applications/Discord.app` plus re-copy from a non-quarantined location.
- **Risk:** User already attempted in past sessions. Likely not the sole cause — but verify it's cleared before testing other classes, otherwise quarantine could mask whether the real fix worked.

### Class 5 — Catch-all (none of the above)

- **Action:** Stop trying fixes. Write findings to `docs/macos-sequoia-status.md`. Pivot README to document Equibop as supported Mac path. This is the dead-end exit per the failure criterion.

### Execution order

1. Pre-clear class 4 (cheap, always do it).
2. Match evidence to class 1, 2, or 3.
3. Apply matched fix only. Don't layer fixes — that masks the real cause.
4. If first match fails to launch, try the next-most-likely class. Max 2 fix branches per session.

## Acceptance test sequence

A fix is only considered working if all of these pass:

1. Discord.app launches without "damaged" dialog.
2. Nyxcord settings panel visible inside Discord (proves the patched `app.asar` actually loaded, not just that Discord launched with stock asar).
3. Quit Discord, relaunch → still launches (no first-launch fluke from cached signing decisions).
4. Reboot the Mac, launch Discord → still launches (no in-memory state masking the fix).
5. `pnpm uninject` → Discord launches normally → re-run `pnpm inject` → patched Discord launches normally. Round-trip works.
6. Document the exact command sequence and entitlements file used, so a stranger on Sequoia can reproduce.

## Deliverables

### If a fix works

- `scripts/macos-sign.sh` — new script that runs the matched fix sequence post-patch. Called from `install.sh` on `darwin` only.
- `scripts/macos-entitlements.plist` — if class 2 fix wins, the entitlements file used.
- `install.sh` — adds a `darwin` branch that calls `scripts/macos-sign.sh` after `pnpm inject`.
- `README.md` — "macOS install" section updated with prerequisites (Sequoia 15+ supported, fresh Discord.app required, what the script does and why).
- `docs/diagnostics/2026-05-28-sequoia-inject/README.md` — short writeup of what we found and which class won. Has value for future-you and for a potential upstream PR to Equilotl/VencordInstaller.

### If no fix works

- All diagnostic evidence still committed (record has value even on failure).
- `docs/macos-sequoia-status.md` — "What we tried, what we learned, why we stopped."
- `install.sh` — adds a `darwin` branch that prints "macOS Sequoia inject is not supported; see README for Equibop install" and exits cleanly.
- `README.md` — Equibop documented as the Mac path.

## Out of scope

- Equibop install automation (separate spec when/if needed).
- Apple Developer ID purchase + notarization (€99/yr, separate decision).
- Upstreaming the fix to Equilotl / VencordInstaller (worth doing later, not blocking this spec).
- GitHub Actions auto-firing fix (separate, smaller spec).
- Any v0.2 polish beyond what the install path requires.

## Related

- Project memory: `~/.claude/projects/-Users-andrejpokorny/memory/project_nyxcord.md`
- Prior spec: `~/Nyxcord/docs/superpowers/specs/2026-05-24-discord-client-fork-design.md`
- Upstream installer (Equilotl): https://github.com/Equicord/Equilotl
- Upstream installer (Vencord): https://github.com/Vencord/Installer
