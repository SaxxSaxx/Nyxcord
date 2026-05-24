# Design — Discord client fork (Nightcord-equivalent)

**Date:** 2026-05-24
**Status:** Draft, awaiting user review
**Working name:** `<clientname>` (placeholder — locked at plan time)
**Project root:** `~/<clientname>/` (currently `~/discord-client-fork/`, renamed once `<clientname>` is chosen)

## 1. Goal

Build a personal-brand Discord client mod in the Vencord lineage, with feature parity to [Nightcord](https://github.com/nightcordoff/nightcord), distributable to a small community of friends.

"Same features as Nightcord" decomposes to four concrete items, three of which are already provided by upstream:

| Nightcord feature | Source |
|---|---|
| Silent auto-updates | Inherited from Equicord's updater |
| No obfuscation | Already true of Equicord (Nightcord's claim is marketing) |
| Glassmorphism UI | Port Nightcord's CSS into a built-in theme |
| Enhanced voice DSP | Port Nightcord's plugin (the only real new code) |

Net: the work is rebrand + theme port + voice plugin port + installer scripts. Not building a new client engine.

## 2. Non-goals

- Custom plugin/theme marketplace UI
- Mobile clients
- Direct Discord API access (selfbot-style features)
- Custom voice codecs beyond porting Nightcord's DSP plugin
- Code signing for v0 (revisit after real usage)

## 3. Architecture

Standard Vencord-lineage stack. Nothing exotic.

**Upstream:** Fork [Equicord](https://github.com/Equicord/Equicord) directly, not Nightcord. Rationale:
- Equicord is cross-platform; Nightcord is Windows-only. User is on macOS and needs to dogfood the client.
- One fewer dependency layer (Vencord → Equicord → ours, instead of Vencord → Equicord → Nightcord → ours).
- Equicord is more actively maintained than a fork-of-a-fork.

**Build:** `pnpm + esbuild`, unchanged from upstream.

**Patching model:** Inherited from Vencord. Plugins declare `find` + `replacement: { match, replace }` blocks. At runtime, a shim on `webpackChunkdiscord_app.push` intercepts module loads and applies patches before Discord boots. No fork-level changes to this layer.

**Injection:** `pnpm inject` rewrites Discord's `app.asar` boot path to load `patcher.js` first. `pnpm uninject` reverses it. Both ship in Equicord, cross-platform. We change branding strings only.

**Plugin surface:**
- *Built-in plugins:* compiled into the bundle. Houses our preset feature set + ported voice DSP.
- *User plugins:* loaded from disk at runtime via Equicord's existing loader. No change.

**Themes:** CSS files in a folder. Our default glassmorphism theme ships as a built-in.

**Updater:** Equicord's existing updater, with the source-repo URL pointed at our GitHub fork.

**Divergence discipline:** Keep all `<clientname>`-specific code in clearly-named files (`src/<clientname>/`, `assets/<clientname>/`, theme CSS, constants for updater URL + branding). Avoid in-place edits of Equicord files. Every edited upstream file becomes a rebase conflict.

## 4. Brand & feature surface

**Identity (locked at plan time):**
- Name → `<clientname>`
- Icon → `.ico` + `.icns` + `.png` set in `assets/<clientname>/`
- Accent color → TBD with name
- Repo URL → `github.com/<userhandle>/<clientname>`

**Default theme:** Port Nightcord's glassmorphism CSS, ship as built-in `<clientname> Default`, enabled on first install, user-disablable.

**Preset built-in plugins enabled by default:** Final list locked at plan time. Working candidates: `NoTrack`, `MessageLogger`, `FakeNitro`, `BetterFolders`, `ShowHiddenChannels`, `CustomRPC`, `CrashHandler`. Goal is "feels like Nightcord on first launch."

**Nightcord-ported features:**
- Voice DSP plugin → ported as built-in plugin (the only non-trivial code port)
- Silent auto-update → use Equicord's updater as-is, just point at our repo
- Glassmorphism → see default theme above
- No-obfuscation → free, already upstream

**Settings UI:** Equicord's existing settings page, branding header swapped. No custom UI for v0.

## 5. Distribution

**Repo:** Public GitHub repo at `github.com/<userhandle>/<clientname>`. README modeled on Nightcord's structure: features, install script per OS, build-from-source, ToS disclaimer.

**Installers:**
- *Windows:* `install.ps1` — downloads latest release, runs `pnpm inject`.
- *macOS:* `install.sh` — same pattern. Equicord already has working Mac inject paths.
- *Linux:* `install.sh` reused, with Equicord's known Discord paths.

**Releases:** GitHub Releases, prebuilt JS bundle as artifact. Tag = semver. Updater pulls from latest release on launch.

**Code signing:** Skipped for v0. Mac users follow a "right-click → Open" workaround documented in README. Windows users click through SmartScreen. Revisit only if usage justifies the ~$300/yr combined cert cost.

**Update flow:** Launch → updater (rebranded Equicord updater) → checks our main branch → if new commits, prompts user, rebuilds in-place, restarts Discord. Identical UX to Vencord.

**Onboarding doc:** README contains: install script links, "use a secondary account, this is against Discord ToS," issue-reporting template.

## 6. Maintenance

**Rebase cadence:** Pull Equicord upstream weekly. Discord pushes breaking changes every few weeks; Equicord patches within hours-to-days; we inherit fixes by rebasing. Skipping rebases for a month produces a painful merge and broken client.

**Issue triage:** GitHub Issues with template that asks "reproduced on vanilla Equicord first?" Most reported bugs are upstream issues. Triage = either redirect to Equicord, or treat as `<clientname>`-only.

**Kill switch:** README documents a one-command path back to vanilla Equicord (`pnpm uninject` + install Equicord). No user becomes trapped on a fork the maintainer abandoned.

## 7. v0 done criteria

- [ ] Fork builds cleanly on the user's Mac
- [ ] `pnpm inject` works locally; Discord launches with `<clientname>` branding
- [ ] Default glassmorphism theme renders
- [ ] Voice DSP plugin compiled in and loadable
- [ ] At least one Windows tester can run `install.ps1` end-to-end and reach a working client
- [ ] Updater points at our repo and successfully pulls and applies an update
- [ ] README + ToS disclaimer published

## 8. Decisions deferred to plan time

These don't block writing the implementation plan, but the plan must resolve them in its first task:

1. **`<clientname>` final name** + accent color
2. **Preset plugin list** (final cut from working candidate list in §4)
3. **GitHub handle to host under** (`SaxxSaxx` vs alt) — affects repo URL baked into updater
4. **Mac install path:** Discord.app default vs Discord Canary vs Discord PTB. Plan should pick one as primary, document others as supported.

## 9. Risks

- **ToS / account ban:** Vencord-family clients violate Discord ToS. Enforcement has been historically quiet but is not zero. Mitigation: README guidance to use a secondary account, no marketing of the client to non-consenting users.
- **Upstream rot:** Equicord goes quiet → we either rebase off Vencord directly (manageable, similar enough) or maintain the patch layer ourselves (painful). Risk is real but graceful.
- **Discord aggressive patching:** Periodically Discord ships Webpack changes that break all client mods for a day or two. We inherit upstream's recovery time; no mitigation, just communication to users.
- **Maintainer burnout:** Per user's known pattern, side projects can become draining. Mitigation: documented kill switch (§6) so users aren't stranded if work pauses.
- **Voice DSP port risk:** This is the only non-trivial code port. If Nightcord's implementation depends on native modules or platform-specific APIs that don't port cleanly to Mac, scope shrinks (ship without voice DSP for v0) — not a project-killer.
