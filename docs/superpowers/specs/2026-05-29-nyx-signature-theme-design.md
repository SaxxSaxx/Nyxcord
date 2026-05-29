# Nyx — Nyxcord's signature theme

**Date:** 2026-05-29
**Status:** approved (design)
**Author:** Saxx

## Problem

Nyxcord today is functionally an Equicord rebrand plus an identity/LARP plugin bundle. It has no visual identity of its own. Comparable mods get their character from a signature *look* — e.g. the "Nightcord" theme gives Discord the melancholic teal/purple mood of *Nightcord at 25:00* (Project Sekai). Nyxcord needs its own face.

## Goal

Ship a built-in signature theme — **Nyx** — that is Nyxcord's default visual identity: on out of the box, toggleable like any plugin, and customizable enough to be fun without scope creep.

## Identity: how Nyx differs from Nightcord

Nightcord leans on the *Nightcord at 25:00* fan aesthetic: teal/cyan + purple, melancholic, an underwater/drowning motif.

Nyx leans on Nyxcord's actual namesake — **Nyx, the Greek primordial goddess of night**. The mood is *cosmic and regal*, not melancholic:

- **Void-black base**, tinted a hair toward violet (not neutral grey, not teal).
- **Violet → indigo accents** built on the existing brand accent `#a855f7`.
- A signature **nebula glow** on interactive accents (selected channel, links, mentions, primary buttons).
- An optional faint **starfield** layer behind the app — the "under the night sky" feeling, vs Nightcord's "underwater."

Where Nightcord feels like being submerged, Nyx feels like standing under the night sky.

## Approach (chosen)

A built-in plugin, `NyxcordTheme`, `enabledByDefault: true`, that applies a **variable-driven** theme via a managed stylesheet.

Variable-driven (overriding Discord's documented theming CSS custom properties under the stable `.theme-dark` / `.theme-darker` / `.theme-midnight` body classes) rather than targeting mangled Discord class names. Rationale: mangled-class theming breaks on every Discord update; variable theming survives it. This is also how robust real-world Discord themes are written.

### Rejected alternatives

- **Ship a `.theme.css` the installer drops into the themes dir + auto-enables.** Fragile across updates, fights the user's own theme list, no settings UI. (We still export a standalone `.theme.css` for power users to fork — see below — but it is not the shipping mechanism.)
- **A pure `QuickCSS` injection.** No toggle, no settings, collides with the user's own QuickCSS.

## Components

```
src/equicordplugins/nyxcordTheme/
  index.tsx     # plugin def, settings, start/stop: inject CSS vars + enableStyle
  styles.css    # imported "?managed"; variable overrides + glow + starfield
```

- **`styles.css` (managed):**
  - Overrides Discord background/brand/text/mention/link theming variables under `.theme-dark, .theme-darker, .theme-midnight` (and visual-refresh `--neutral-*-hsl` ramp) to the void-violet palette.
  - References settings-driven vars (`--nyx-accent-h/s/l`, `--nyx-glow`, `--nyx-star-opacity`) so settings update live without rebuilding CSS strings.
  - Nebula glow: `box-shadow`/`text-shadow` keyed to `--nyx-glow` on accent surfaces.
  - Starfield: `#app-mount::before`, a fixed radial-gradient star layer at `--nyx-star-opacity`, pointer-events none, behind content. `#app-mount` is a stable id.
- **`index.tsx`:**
  - `definePlugin({ name: "NyxcordTheme", enabledByDefault: true, tags: ["Appearance", "Customisation"], authors: [EquicordDevs.Saxx] })`.
  - `startAt: StartAt.DOMContentLoaded` to set the CSS vars before paint (no flash), then `enableStyle(styles)`.
  - `stop()` → `disableStyle(styles)` and remove the injected vars node.
  - Settings (all live via `onChange` → re-inject vars; no `restartNeeded`):
    - `accentHue` — SLIDER, default 270 (violet). Recolors accent + glow.
    - `glow` — SLIDER 0–100, default 45. Glow intensity.
    - `starfield` — BOOLEAN, default true.

### Data flow

settings → `applyVars()` sets `--nyx-*` custom properties on `documentElement` → managed `styles.css` consumes them. No store, no persistence beyond plugin settings, no network.

## Out of scope (YAGNI)

- Multiple bundled theme variants (light Nyx, alt palettes). One signature theme, done well.
- Animated/particle starfield. Static radial-gradient only — zero runtime cost.
- Any backend / sync (that's the deferred Path B paid roadmap).

## Deliverables

1. `NyxcordTheme` plugin (above), enabled by default.
2. `EquicordDevs.Saxx` author entry.
3. Standalone `misc/Nyx.theme.css` mirroring the look, for power users to fork.
4. README + BRANDING.md note: Nyx is the signature theme, on by default.

## Verification

- `pnpm build` succeeds with the new plugin in the bundle.
- `pnpm lint` / typecheck clean for the new files.
- Manual: the standalone `Nyx.theme.css` loads in a Vencord/Equicord themes dir without console errors (where a client is available).
