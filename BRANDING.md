# Branding — locked values

These values are referenced by all subsequent plan tasks. Do not change after Task 1 without re-reading every task.

- **Client name:** `Nyxcord`
- **Accent color (hex):** `#a855f7` (HSL hue 270, the Nyx violet used by the signature theme)
- **Signature theme:** `NyxcordTheme` — void violet, nebula glow, optional starfield. On by default. Standalone fork at `misc/Nyx.theme.css`.
- **GitHub owner:** `SaxxSaxx`
- **Repo URL:** `https://github.com/SaxxSaxx/Nyxcord`
- **Mac install target:** `Discord` (stable)
- **Preset plugins enabled by default:**

  Privacy + QoL (v0.1.0 bundle):
  - NoTrack (already `required: true` in upstream — always on, can't be toggled off)
  - MessageLogger
  - SilentTyping (Vencord's name for what we called NoTypingIndicator — same feature)
  - CrashHandler (already `enabledByDefault: true` in upstream)
  - FakeNitro
  - ShowHiddenChannels
  - BetterFolders
  - CustomRPC

  Identity / LARP bundle (v0.1.2 — Path A of the paid-product roadmap, no backend yet):
  - UserPFP (custom avatar synced to other UserPFP/Nyxcord users)
  - USRBG (custom banner synced)
  - Decor (avatar decoration overlay)
  - GlobalBadges (mirror badges from BD/Vencord/Equicord ecosystems)
  - CustomUserColors (your username's display color)
  - ShowBadgesInChat (your badges visible in every message)
  - MentionAvatars (avatars next to @mentions)
  - BannersEverywhere (banner shown in more UI surfaces)

  QoL loadout (v0.4.1):
  - PlatformIndicators, TypingTweaks, ImageZoom, ViewIcons, ReverseImageSearch, PinDMs, ReadAllNotificationsButton, MoreUserTags
  - (enabledByDefault only affects fresh installs; existing users keep their own toggles)

  Signature theme:
  - v0.2.0–v0.4.1: shipped as the NyxcordTheme plugin (night-sky, nebula glow, twinkling starfield, 8 moods, surface coverage)
  - v0.5.0: moved OUT of plugins into the Themes tab — 8 hosted "mood" themes (misc/themes/, hosted on gh-pages), installed once by an invisible NyxcordThemes bootstrap (required+hidden). Nyx on by default; pick a mood in Settings → Themes.

  Brand + growth (v0.3.0):
  - NyxcordBadge (profile badge for Nyxcord users, list curated in repo badges.json)
  - NyxcordWelcome (one-time first-run welcome modal)

## Roadmap

- **Path A (v0.1.x):** open-ecosystem identity overlays, free. Done.
- **Path B (vNext, paid):** Nyxcord-run backend for identity sync. Differentiator vs Vencord = **custom username sync** (the one identity field no open-ecosystem plugin covers). Paid tier ~€3-5/mo: persona presets, animated avatars, premium badges, per-server profile switching, multi-device sync. Backend: API server + image CDN + Discord OAuth + Stripe/LemonSqueezy. Deferred until Curlytic + Fragrance picker launches clear the calendar.

## v0 status
- macOS inject: ⏸ deferred (Sequoia blocks ad-hoc inject; future via Equibop)
- Windows inject: ✅ 2026-05-25 (friend tester)
- v0.1.0 shipped: 2026-05-25
- v0.1.1 shipped: 2026-05-25 (updater e2e bump)
- v0.1.2 shipped: 2026-05-25 (Identity bundle, Path A)
- v0.2.0 shipped: 2026-05-29 (Nyx signature theme, NyxcordTheme on by default)
- v0.3.0 shipped: 2026-05-30 (theme moods + NyxcordBadge + NyxcordWelcome)
- v0.3.1 shipped: 2026-05-30 (8 built-in theme moods + tiered badges)
- v0.4.0 shipped: 2026-05-30 (NyxcordCatchUp — AI /catchup, bring-your-own-key, free)
- v0.4.1 shipped: 2026-06-03 (softer twinkling starfield + theme surface coverage + 8 QoL preset plugins)
- v0.5.0 shipped: 2026-06-03 (Nyx theme moved to the Themes tab as 8 hosted mood themes)
- v0.6.0 shipped: 2026-06-03 (Presets tab + welcome integration)
- v0.7.0 (in progress): Nyx Deep theme — transformative translucent-panels-over-animated-nebula look, added as a 9th mood in the Themes tab
