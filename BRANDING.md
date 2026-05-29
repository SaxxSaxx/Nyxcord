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

  Signature theme (v0.2.0):
  - NyxcordTheme (void violet night-sky theme, nebula glow, starfield; settings: accent hue, glow, starfield)

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
