# Nyxcord

A personal-brand Discord client mod, forked from [Equicord](https://github.com/Equicord/Equicord) (itself a fork of [Vencord](https://github.com/Vendicated/Vencord)).

What you get over vanilla Discord:

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
