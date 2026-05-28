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
