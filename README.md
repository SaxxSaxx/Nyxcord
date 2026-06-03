# Nyxcord

**[nyxcord website →](https://saxxsaxx.github.io/Nyxcord/)**

![Nyxcord theme moods](https://saxxsaxx.github.io/Nyxcord/nyxcord-moods.gif)

A personal-brand Discord client mod, forked from [Equicord](https://github.com/Equicord/Equicord) (itself a fork of [Vencord](https://github.com/Vendicated/Vencord)).

What you get over vanilla Discord:

- **Signature look (Nyx)** — a cosmic night sky theme with four moods (Nyx, Aurora, Eclipse, Nebula), a nebula glow, and an optional starfield, on by default. Where the popular Nightcord theme goes melancholic and underwater, Nyx goes regal and celestial, after Nyxcord's namesake (Nyx, the Greek primordial goddess of night).
- **Nyxcord badge** — a profile badge for Nyxcord users, so the community is visible at a glance.
- **AI catch-up** — `/catchup` summarizes what you missed in a channel. Bring your own Anthropic or OpenAI key, so it stays free.
- **Privacy by default** — analytics + Sentry blocked (NoTrack), typing indicator hidden (SilentTyping), crash recovery enabled.
- **Message history** — see deleted and edited messages.
- **QoL preset on** — FakeNitro, ShowHiddenChannels, BetterFolders, CustomRPC.
- **Identity / LARP bundle** — custom avatar (UserPFP), custom banner (USRBG), avatar decoration (Decor), and badge mirror (GlobalBadges), all synced cross-Nyxcord. Plus CustomUserColors, ShowBadgesInChat, MentionAvatars, BannersEverywhere to make your persona visible everywhere.
- **Full Equicord plugin library** — 300+ optional plugins inherited from upstream, all toggleable.
- **Auto-updates** — pulls from this repo on launch and prompts you when there's a new version.

## Identity / LARP

Nyxcord ships the identity-overlay plugins on by default so you can pick a persona and have other Nyxcord (and UserPFP/USRBG/Decor) users see it:

- Open Discord → Settings → **Nyxcord** → find UserPFP / USRBG / Decor in the plugin list
- Upload an avatar / banner / decoration to the respective ecosystem
- Other Nyxcord users will see your custom persona; non-Nyxcord users still see your real Discord identity

Custom **username** sync isn't here yet (no open-ecosystem plugin does it). It's planned as the marquee feature of a future paid tier with a Nyxcord-run backend.

## Signature look (Nyx)

Nyx gives Nyxcord its face: a night-sky base, a nebula glow on links, mentions, the selected channel and primary buttons, and a soft twinkling starfield. It ships as eight **themes** (not a plugin), installed into your Themes tab automatically.

- Open Settings → **Themes** and pick a **mood**: Nyx (void violet), Aurora (teal), Eclipse (austere indigo), Nebula (magenta), Midnight (deep blue), Rose (pink dusk), Ember (warm amber), Mono (minimalist). Nyx is on by default.
- Enable one mood at a time. Toggle them all off for plain Equicord styling.
- Each mood is a normal CSS theme hosted in this repo (`misc/themes/`), so power users can fork the look.

## Install

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/SaxxSaxx/Nyxcord/main/install.sh | bash
```

Requires `git`, `node` (LTS), and `pnpm`. Install pnpm with `npm install -g pnpm` if you don't have it.

### Windows

1. Download [install.ps1](https://raw.githubusercontent.com/SaxxSaxx/Nyxcord/main/install.ps1).
2. Right-click the file → **Run with PowerShell**.
3. Restart Discord.

If Windows SmartScreen blocks the script, click "More info" → "Run anyway." (Nyxcord builds are not code-signed for now.)

### Build from source

```bash
git clone https://github.com/SaxxSaxx/Nyxcord
cd Nyxcord
pnpm install
pnpm build
pnpm inject
```

`pnpm inject` will ask which Discord variant to patch (Discord / Discord Canary / Discord PTB).

## Uninstall

```bash
cd ~/.nyxcord    # or wherever you installed
pnpm uninject
```

That reverts Discord back to its original state. Safe and reversible.

## Disclaimer

Nyxcord is not affiliated with, authorized, or endorsed by Discord Inc. Use of third-party client modifications **violates Discord's Terms of Service**. Accounts using Nyxcord (or any Vencord-family client) may be flagged or banned.

**Use a secondary account.** Don't run Nyxcord on an account you care about losing.

## Credits

- [Vencord](https://github.com/Vendicated/Vencord) — the original architecture, the patching engine, the plugin API. Everything Nyxcord does at runtime is Vencord.
- [Equicord](https://github.com/Equicord/Equicord) — direct upstream. Nyxcord rebases off Equicord weekly; almost all plugins come from there.
- [Nightcord](https://github.com/nightcordoff/nightcord) — the inspiration for this build.

## License

GPL-3.0-or-later, inherited from Vencord and Equicord. See [LICENSE](./LICENSE).
