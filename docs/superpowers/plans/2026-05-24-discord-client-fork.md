# Discord Client Fork — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note on testing:** Vencord-lineage forks are not unit-test-driven. Most verification is "build, inject into Discord, launch, eyeball it." Where unit tests exist (utility code), we use them. Otherwise each task specifies the manual check.

**Goal:** Build a personal-brand Discord client mod with feature parity to Nightcord, forked from Equicord, distributable to a small community.

**Architecture:** Fork [Equicord](https://github.com/Equicord/Equicord), keep all upstream files untouched where possible, isolate divergence in clearly-named files (`src/<clientname>/`, branding constants, theme CSS, updater URL), rebase weekly from upstream.

**Tech Stack:** TypeScript, esbuild, pnpm, Electron (via patching the official Discord client), Node.js LTS.

**Spec:** `docs/superpowers/specs/2026-05-24-discord-client-fork-design.md`

**Working project root:** `~/discord-client-fork/` until Task 15 renames it.

---

## Task 1: Lock deferred decisions

**Files:**
- Create: `~/discord-client-fork/BRANDING.md`

These five values flow through every subsequent task. Lock them once, in one file, so later tasks have no ambiguity.

- [ ] **Step 1: Create the branding file with locked values**

The engineer presents this template to the user, fills in each blank, then commits.

```markdown
# Branding — locked values

These values are referenced by all subsequent plan tasks. Do not change after Task 1 without re-reading every task.

- **Client name:** <fill in, e.g. `Saxxcord`>
- **Accent color (hex):** <fill in, e.g. `#a855f7`>
- **GitHub owner:** <`SaxxSaxx` or chosen handle>
- **Repo URL:** `https://github.com/<owner>/<clientname>`
- **Mac install target:** <`Discord` | `Discord Canary` | `Discord PTB`> (the official client variant we inject into; document others as also-supported in README)
- **Preset plugins enabled by default:** (final cut from working candidates: NoTrack, MessageLogger, FakeNitro, BetterFolders, ShowHiddenChannels, CustomRPC, CrashHandler)
  - <plugin 1>
  - <plugin 2>
  - ...
```

- [ ] **Step 2: Commit**

```bash
cd ~/discord-client-fork
git add BRANDING.md
git commit -m "lock branding decisions for Task 1"
```

---

## Task 2: Bootstrap the fork from Equicord

**Files:**
- Modify: working directory becomes a clone of Equicord (preserves `docs/` from current repo)

- [ ] **Step 1: Verify prerequisites**

```bash
node --version    # expect v20.x or v22.x (LTS)
pnpm --version    # expect 9.x; install with `npm i -g pnpm` if missing
git --version
```

Expected: all three print a version. If pnpm is missing, install before continuing.

- [ ] **Step 2: Clone Equicord into a scratch directory and merge it into the project**

We keep the existing `~/discord-client-fork/` (which contains `docs/` + `BRANDING.md`) and pull Equicord's tree into it.

```bash
cd ~
git clone https://github.com/Equicord/Equicord.git equicord-upstream
cd equicord-upstream
git remote rename origin upstream
```

- [ ] **Step 3: Merge Equicord into the discord-client-fork repo**

```bash
cd ~/discord-client-fork
git remote add equicord ~/equicord-upstream
git fetch equicord
git merge --allow-unrelated-histories equicord/main -m "merge Equicord upstream as fork base"
```

If merge conflicts occur on `docs/` they will be trivial (Equicord doesn't ship a `docs/superpowers/` tree). Resolve by keeping our `docs/` and Equicord's everything-else.

- [ ] **Step 4: Install dependencies**

```bash
cd ~/discord-client-fork
pnpm install
```

Expected: completes without error, creates `node_modules/`.

- [ ] **Step 5: Verify a clean Equicord build works**

```bash
pnpm build
```

Expected: produces `dist/` directory, no errors. If it fails, do not proceed — investigate upstream issues first.

- [ ] **Step 6: Commit the bootstrap state**

```bash
git add -A
git commit -m "bootstrap fork from Equicord upstream"
```

- [ ] **Step 7: Note the Equicord commit we forked from**

```bash
git log equicord/main -1 --format='%H %s' > UPSTREAM_BASE.txt
git add UPSTREAM_BASE.txt
git commit -m "record Equicord base commit for rebase tracking"
```

---

## Task 3: Create branding constants module

**Files:**
- Create: `src/<clientname>/branding.ts` (engineer substitutes name from BRANDING.md)

We centralize every brand string in one file so future rebases never touch hardcoded names scattered across the tree.

- [ ] **Step 1: Create the branding directory and module**

Using the locked name from `BRANDING.md` (denoted `<clientname>` below — engineer substitutes the literal string everywhere):

```typescript
// src/<clientname>/branding.ts

export const BRAND_NAME = "<clientname>";        // exact name from BRANDING.md
export const BRAND_ACCENT = "#<hex>";            // from BRANDING.md
export const BRAND_REPO_OWNER = "<owner>";       // from BRANDING.md
export const BRAND_REPO_NAME = "<clientname>";   // typically same as BRAND_NAME, lowercased
export const BRAND_REPO_URL = `https://github.com/${BRAND_REPO_OWNER}/${BRAND_REPO_NAME}`;
export const BRAND_UPDATE_URL = `${BRAND_REPO_URL}.git`;
```

- [ ] **Step 2: Verify it compiles**

```bash
pnpm tsc --noEmit src/<clientname>/branding.ts
```

Expected: no output (no errors). If `tsc` complains about the path, run it from the project root.

- [ ] **Step 3: Commit**

```bash
git add src/<clientname>/branding.ts
git commit -m "add branding constants module"
```

---

## Task 4: Point Equicord's updater at our repo

**Files:**
- Modify: `src/utils/constants.ts` (Equicord file — find the existing updater URL and override) OR `src/equicordplugins/_core/updater.ts` (the actual repo constant location varies — see Step 1)
- Modify: `src/<clientname>/branding.ts` if updater needs branch name

The exact file holding Equicord's update repo URL has moved between versions. Find it first.

- [ ] **Step 1: Locate Equicord's hardcoded repo URL**

```bash
cd ~/discord-client-fork
grep -rn "Equicord/Equicord" src/ | grep -v node_modules | head -20
```

Expected: one or two matches, typically in a constants file like `src/utils/constants.ts` or `src/equicordplugins/_core/updater/*`.

- [ ] **Step 2: Replace each Equicord/Equicord URL with our repo URL**

For each file the previous command returned, replace `Equicord/Equicord` (and any related `https://github.com/Equicord/Equicord` URLs) with the values from `BRANDING.md`. Concrete example for `src/utils/constants.ts`:

```diff
- export const REPO_OWNER = "Equicord";
- export const REPO_NAME = "Equicord";
+ import { BRAND_REPO_OWNER, BRAND_REPO_NAME } from "../<clientname>/branding";
+ export const REPO_OWNER = BRAND_REPO_OWNER;
+ export const REPO_NAME = BRAND_REPO_NAME;
```

- [ ] **Step 3: Rebuild and confirm no compile errors**

```bash
pnpm build
```

Expected: success, no errors mentioning the updater path.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "point updater at our fork's repo URL"
```

Note: `git add -A` is used because the exact set of files modified in step 2 depends on where Equicord currently keeps its updater constants — varies between upstream versions.

---

## Task 5: Swap visible branding (window title, settings header, about page)

**Files:**
- Modify: any file in `src/` containing user-visible "Equicord" strings (locate via grep)
- Modify: `src/main/patcher.ts` or equivalent (window title, if set there)
- Modify: `package.json` (`name`, `productName`, `description`)

We change only what users see. Internal Equicord identifiers (file names, class names) stay so rebases remain clean.

- [ ] **Step 1: Locate user-visible Equicord strings**

```bash
cd ~/discord-client-fork
grep -rn "Equicord" src/ package.json | grep -v node_modules | grep -v UPSTREAM_BASE > /tmp/equicord-strings.txt
wc -l /tmp/equicord-strings.txt
```

Expected: roughly 30-80 matches. Review the list and identify the *user-visible* subset (strings in JSX rendered to the user, settings page headers, modal titles). Skip variable names, comments, file paths.

- [ ] **Step 2: Replace each user-visible occurrence**

Read each match from `/tmp/equicord-strings.txt`. For each one rendered to the user, replace with `BRAND_NAME` from the branding module:

```typescript
// Use a relative import path — Equicord's tsconfig may or may not expose path aliases.
// Adjust depth (../, ../../) to match the file's location.
import { BRAND_NAME } from "../<clientname>/branding";
// before:  <h1>Equicord Settings</h1>
// after:   <h1>{BRAND_NAME} Settings</h1>
```

For files that don't naturally take an import (e.g. `package.json`), inline the literal string from `BRANDING.md`.

- [ ] **Step 3: Rebuild**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "swap user-visible branding strings to <clientname>"
```

---

## Task 6: Add icon assets

**Files:**
- Create: `assets/<clientname>/icon.ico` (Windows)
- Create: `assets/<clientname>/icon.icns` (macOS)
- Create: `assets/<clientname>/icon.png` (PNG, 1024x1024, used for everything else)
- Modify: build config (`browser/manifest.json` or similar) to reference the new icon

- [ ] **Step 1: Generate icon set**

If the user has a source PNG, convert it. If not, prompt them. For converting one PNG to `.ico` + `.icns` on macOS:

```bash
mkdir -p ~/discord-client-fork/assets/<clientname>
# Place source PNG at /tmp/icon-source.png (1024x1024)
sips -s format png -z 1024 1024 /tmp/icon-source.png --out ~/discord-client-fork/assets/<clientname>/icon.png

# .icns
mkdir /tmp/icon.iconset
for size in 16 32 64 128 256 512 1024; do
  sips -z $size $size /tmp/icon-source.png --out /tmp/icon.iconset/icon_${size}x${size}.png
done
iconutil -c icns /tmp/icon.iconset -o ~/discord-client-fork/assets/<clientname>/icon.icns

# .ico (needs ImageMagick: `brew install imagemagick`)
magick /tmp/icon-source.png -define icon:auto-resize=256,128,64,48,32,16 \
  ~/discord-client-fork/assets/<clientname>/icon.ico
```

- [ ] **Step 2: Wire icons into the build**

Find Equicord's existing icon reference:

```bash
grep -rn "icon\." browser/ 2>/dev/null | head
```

Replace with paths to our new assets. Exact diff depends on Equicord's current config — common location is `browser/manifest.json` or `scripts/build/common.mjs`.

- [ ] **Step 3: Rebuild and visually confirm icon renders in build output**

```bash
pnpm build
ls -la dist/ | grep -i icon
```

Expected: the new icon files are in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add assets/<clientname>/ browser/manifest.json
git commit -m "add <clientname> icon set and wire into build"
```

---

## Task 7: Port Nightcord's glassmorphism theme as built-in default

**Files:**
- Create: `src/<clientname>/themes/default.css`
- Modify: `src/Vencord.ts` or equivalent theme loader entry (find via grep)

- [ ] **Step 1: Fetch Nightcord's CSS source**

```bash
cd /tmp
git clone https://github.com/nightcordoff/nightcordclient.git nightcord-source
find nightcord-source -name "*.css" -o -name "*.scss" | head
```

Identify their glassmorphism stylesheet (likely a `themes/` subdir or under `src/`).

- [ ] **Step 2: Copy the relevant CSS into our project**

```bash
cp /tmp/nightcord-source/<path-to-glass-css> \
   ~/discord-client-fork/src/<clientname>/themes/default.css
```

Add a one-line attribution comment at the top:

```css
/* Glassmorphism base ported from https://github.com/nightcordoff/nightcordclient — MIT */
```

(Verify Nightcord's actual license before this step — if not MIT, adjust the attribution and notify the user.)

- [ ] **Step 3: Register the theme as a built-in**

Find Equicord's theme registration mechanism:

```bash
grep -rn "builtinThemes\|themes.push\|registerTheme" src/ | head
```

Add our theme to that list. Exact code depends on Equicord's API.

- [ ] **Step 4: Rebuild and verify the file is in the bundle**

```bash
pnpm build
grep -l "<clientname>.*default" dist/*.js | head
```

Expected: at least one match — the CSS string is embedded in the bundle.

- [ ] **Step 5: Commit**

```bash
git add src/<clientname>/themes/ src/<clientname>/branding.ts <files-modified-in-step-3>
git commit -m "port Nightcord glassmorphism theme as <clientname> default"
```

---

## Task 8: Set preset plugin defaults

**Files:**
- Modify: `src/utils/settings.ts` or the file holding default plugin enabled state (locate via grep)

- [ ] **Step 1: Locate Equicord's default-enabled-plugins config**

```bash
grep -rn "enabledByDefault\|defaultEnabled" src/ | head
```

- [ ] **Step 2: Flip preset plugins from BRANDING.md to enabled-by-default**

For each plugin in the locked preset list (e.g. NoTrack, MessageLogger, FakeNitro, BetterFolders, ShowHiddenChannels, CustomRPC, CrashHandler — engineer uses the actual locked list), set their default-enabled flag to `true`.

Exact diff depends on Equicord's plugin registration pattern. Typical:

```diff
- export default definePlugin({
-     name: "NoTrack",
-     enabledByDefault: false,
+ export default definePlugin({
+     name: "NoTrack",
+     enabledByDefault: true,
```

- [ ] **Step 3: Rebuild**

```bash
pnpm build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "enable preset plugins by default for first-run UX"
```

---

## Task 9: Voice DSP — investigate and decide

**Files:**
- Create: `docs/<clientname>-voice-dsp-investigation.md` (decision record)
- Create (conditionally): `src/<clientname>/plugins/voiceDsp.ts`

The riskiest task. We investigate first, then port-or-skip based on findings.

- [ ] **Step 1: Locate Nightcord's voice DSP code**

```bash
cd /tmp/nightcord-source
grep -rn -i "voice.*dsp\|enhance.*voice\|hardware.*voice\|audio.*processor" . | head -30
ls -la src/equicordplugins/ 2>/dev/null | grep -i voice
ls -la src/plugins/ 2>/dev/null | grep -i voice
```

If multiple files: read each, identify the actual DSP implementation (vs config UI).

- [ ] **Step 2: Classify the implementation**

Write findings to `docs/<clientname>-voice-dsp-investigation.md`:

```markdown
# Voice DSP investigation — 2026-05-24

## What Nightcord ships
- Files: <list>
- Implementation type: <pure JS / native module / patches into Discord internals>
- Platform constraints: <Windows-only? cross-platform?>

## Portability
- Can we port verbatim? <yes/no/with-changes>
- If with-changes: what changes?
- If no: why?

## Decision
- [ ] Port for v0
- [ ] Defer to post-v0
- [ ] Skip entirely — document in README that voice DSP is not included
```

- [ ] **Step 3 (conditional, only if "port for v0"): port the plugin**

Copy the relevant files to `src/<clientname>/plugins/`, add attribution comment, adapt any imports to our paths, register in Equicord's plugin index.

```bash
cp /tmp/nightcord-source/<voice-dsp-file> \
   ~/discord-client-fork/src/<clientname>/plugins/voiceDsp.ts
# edit imports, attribution header
```

- [ ] **Step 4: Rebuild**

```bash
pnpm build
```

Expected: success. If port-for-v0 was chosen and build fails, fall back to "defer to post-v0" and remove the file.

- [ ] **Step 5: Commit**

```bash
git add docs/<clientname>-voice-dsp-investigation.md src/<clientname>/plugins/voiceDsp.ts
git commit -m "voice DSP investigation: <port|defer|skip>"
```

---

## Task 10: Local Mac inject test

**Files:** none modified; this is verification.

- [ ] **Step 1: Inject into local Discord**

Use the Mac install target from BRANDING.md (e.g. `Discord`):

```bash
cd ~/discord-client-fork
pnpm build
pnpm inject
```

Expected: prompts for Discord variant, asks to confirm path like `/Applications/Discord.app/Contents/Resources/app.asar`, completes.

- [ ] **Step 2: Restart Discord and verify branding**

Quit Discord fully (Cmd-Q), reopen. In Discord:
- Open Settings → look for our brand name (not Equicord) in the sidebar / settings header
- Open the settings page added by our fork → confirm BRAND_NAME shows
- Confirm the default theme is enabled and the glassmorphism look is visible

If any of these fail, debug before continuing. Common failure: cache. Run `pnpm uninject && pnpm inject` again.

- [ ] **Step 3: Document the result**

If success, no changes. If failure, write a decision record to `docs/<clientname>-mac-inject-issues.md` describing the failure and the fix applied, then commit it.

- [ ] **Step 4: Uninject before continuing other tasks**

```bash
pnpm uninject
```

(Optional — only if you want vanilla Discord back between dev cycles.)

---

## Task 11: Write install.sh for macOS and Linux

**Files:**
- Create: `install.sh`

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
set -euo pipefail

CLIENT_NAME="<clientname>"           # from BRANDING.md
REPO_URL="https://github.com/<owner>/<clientname>"
INSTALL_DIR="$HOME/.${CLIENT_NAME,,}"  # lowercase

command -v git >/dev/null  || { echo "git is required"; exit 1; }
command -v node >/dev/null || { echo "node is required (LTS)"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm is required: npm i -g pnpm"; exit 1; }

if [[ -d "$INSTALL_DIR" ]]; then
    echo "Updating existing $CLIENT_NAME at $INSTALL_DIR"
    cd "$INSTALL_DIR"
    git pull --ff-only
else
    echo "Cloning $CLIENT_NAME into $INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

pnpm install
pnpm build
pnpm inject

echo "$CLIENT_NAME installed. Restart Discord."
```

- [ ] **Step 2: Make executable + test locally on Mac**

```bash
cd ~/discord-client-fork
chmod +x install.sh
# Manually inspect — don't run yet because it would re-clone over current dir.
shellcheck install.sh   # install via `brew install shellcheck` if missing
```

Expected: shellcheck passes (or only flags acceptable warnings).

- [ ] **Step 3: Commit**

```bash
git add install.sh
git commit -m "add install.sh for macOS/Linux"
```

---

## Task 12: Write install.ps1 for Windows

**Files:**
- Create: `install.ps1`

- [ ] **Step 1: Write the script**

```powershell
# install.ps1 — <clientname>
$ErrorActionPreference = "Stop"

$ClientName = "<clientname>"
$RepoUrl    = "https://github.com/<owner>/<clientname>"
$InstallDir = Join-Path $env:USERPROFILE ".$($ClientName.ToLower())"

foreach ($cmd in @("git","node","pnpm")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "$cmd is required. Install it before continuing."
        exit 1
    }
}

if (Test-Path $InstallDir) {
    Write-Host "Updating existing $ClientName at $InstallDir"
    Push-Location $InstallDir
    git pull --ff-only
} else {
    Write-Host "Cloning $ClientName into $InstallDir"
    git clone $RepoUrl $InstallDir
    Push-Location $InstallDir
}

pnpm install
pnpm build
pnpm inject
Pop-Location

Write-Host "$ClientName installed. Restart Discord."
```

- [ ] **Step 2: Lint with PSScriptAnalyzer (optional, runs on Windows)**

Note in README that Windows testers should be running PowerShell 5.1+ or 7+.

- [ ] **Step 3: Commit**

```bash
git add install.ps1
git commit -m "add install.ps1 for Windows"
```

---

## Task 13: Write README + ToS notice

**Files:**
- Modify: `README.md` (Equicord's existing README is overwritten)

- [ ] **Step 1: Write the README**

```markdown
# <clientname>

<one-line tagline using BRAND_NAME>

A Discord client mod in the Vencord lineage, forked from [Equicord](https://github.com/Equicord/Equicord). Ships with glassmorphism styling, preset privacy + UX plugins, and silent auto-updates.

## Install

### macOS / Linux
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/<owner>/<clientname>/main/install.sh | bash
\`\`\`

### Windows
Download [install.ps1](https://raw.githubusercontent.com/<owner>/<clientname>/main/install.ps1), right-click → Run with PowerShell.

## Features
- Glassmorphism default theme
- Preset plugins enabled: <list from BRANDING.md>
- Auto-updates from this repo
- Cross-platform (macOS, Windows, Linux)

## Uninstall
\`\`\`bash
cd ~/.<clientname>
pnpm uninject
\`\`\`

## Disclaimer
<clientname> is not affiliated with Discord Inc. Use of third-party clients violates Discord's Terms of Service. **Use a secondary account.** You assume all risk.

## Credits
- [Vencord](https://github.com/Vendicated/Vencord) — the original architecture
- [Equicord](https://github.com/Equicord/Equicord) — direct upstream
- [Nightcord](https://github.com/nightcordoff/nightcord) — glassmorphism inspiration and voice DSP reference

## License
<inherits Equicord's license — verify before publishing>
```

- [ ] **Step 2: Replace placeholders with real values from BRANDING.md**

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "write README with install instructions and ToS notice"
```

---

## Task 14: Push to GitHub + set up Releases workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create the GitHub repo**

User-driven (one of these):
```bash
gh repo create <owner>/<clientname> --public --source ~/discord-client-fork --remote=origin --push
```
or do it via the web UI.

- [ ] **Step 2: Push current main**

```bash
cd ~/discord-client-fork
git push -u origin main
```

- [ ] **Step 3: Add a Releases workflow**

```yaml
# .github/workflows/release.yml
name: release

on:
  push:
    tags: ["v*"]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm i -g pnpm
      - run: pnpm install
      - run: pnpm build
      - name: Bundle dist
        run: tar czf dist.tar.gz dist/
      - uses: softprops/action-gh-release@v2
        with:
          files: dist.tar.gz
```

- [ ] **Step 4: Cut a v0.1.0 release tag**

```bash
git tag v0.1.0
git push origin v0.1.0
```

- [ ] **Step 5: Verify the release artifact appears**

Open `https://github.com/<owner>/<clientname>/releases` in browser. Expected: a v0.1.0 release with `dist.tar.gz` attached.

- [ ] **Step 6: Commit the workflow file**

```bash
git add .github/workflows/release.yml
git commit -m "add release workflow"
git push
```

---

## Task 15: Windows tester end-to-end

**Files:** none modified.

- [ ] **Step 1: Coordinate with a Windows-using friend**

Send them the README's install link. Ask them to:
1. Open PowerShell
2. Run the install command
3. Restart Discord
4. Send a screenshot showing the BRAND_NAME settings page

- [ ] **Step 2: Document any failures**

If anything breaks on Windows, capture the exact error message, write a fix or workaround into the README's "Troubleshooting" section, and commit:

```bash
git add README.md
git commit -m "document Windows install troubleshooting per <tester-handle>"
git push
```

- [ ] **Step 3: Mark v0 done**

Update `BRANDING.md` with a final line:

```markdown
## v0 status
- Mac inject: ✅ <date>
- Windows inject: ✅ <tester> on <date>
```

```bash
git add BRANDING.md
git commit -m "mark v0 done"
git push
```

---

## Task 16: Updater end-to-end test

**Files:** none modified; verification.

- [ ] **Step 1: Make a trivial visible change**

Modify the settings page subtitle (e.g. add a version number):

```diff
- <p>{BRAND_NAME} settings</p>
+ <p>{BRAND_NAME} settings — v0.1.1</p>
```

- [ ] **Step 2: Commit, tag, push**

```bash
git commit -am "bump visible version to v0.1.1 for updater test"
git tag v0.1.1
git push && git push origin v0.1.1
```

- [ ] **Step 3: Trigger updater locally**

Restart Discord. In settings, find the updater panel (inherited from Equicord). Click "Check for updates."

Expected: updater detects a new version, prompts to update, applies it, restarts. After restart the subtitle reads "v0.1.1".

- [ ] **Step 4: If it fails, debug**

Common failure: updater URL still pointing at Equicord (Task 4 didn't catch all references). Grep again, fix, repeat.

---

## Task 17: Rename project directory to `<clientname>`

**Files:** moves project root from `~/discord-client-fork/` to `~/<clientname>/`.

Done last so all earlier paths in this plan resolved cleanly.

- [ ] **Step 1: Close any editor/terminal session inside `~/discord-client-fork/`**

- [ ] **Step 2: Rename**

```bash
cd ~
mv discord-client-fork <clientname>
```

(Using the lowercase name from `BRANDING.md`.)

- [ ] **Step 3: Verify git remote still works**

```bash
cd ~/<clientname>
git remote -v
git status
```

Expected: remote URLs intact, working tree clean.

- [ ] **Step 4: Update any local IDE/editor pinned paths**

Project directory rename complete.

---

## Done criteria (from spec §7)

- [ ] Fork builds cleanly on the user's Mac (Task 2 step 5)
- [ ] `pnpm inject` works locally, Discord launches with `<clientname>` branding (Task 10)
- [ ] Default glassmorphism theme renders (Task 10 step 2)
- [ ] Voice DSP plugin compiled in and loadable OR documented as deferred (Task 9)
- [ ] At least one Windows tester can run `install.ps1` end-to-end and reach a working client (Task 15)
- [ ] Updater points at our repo and successfully pulls and applies an update (Task 16)
- [ ] README + ToS disclaimer published (Task 13, Task 14 step 2)

---

## Rebase discipline (post-v0)

Once a week (set a calendar reminder):

```bash
cd ~/<clientname>
git fetch equicord
git rebase equicord/main
# resolve conflicts — should be minimal if Task 3 + Task 5 discipline held
pnpm install
pnpm build
pnpm inject   # smoke test
git push --force-with-lease
```

Update `UPSTREAM_BASE.txt` to record the new base commit each time.
