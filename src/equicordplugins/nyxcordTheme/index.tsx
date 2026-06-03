/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { get, set } from "@api/DataStore";
import { Settings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";

// The Nyx theme now lives in the Themes tab as eight online "mood" themes rather
// than as a plugin. This invisible installer adds them to the user's theme list
// once (migrating existing installs, seeding fresh ones), then does nothing.

const BASE = "https://saxxsaxx.github.io/Nyxcord/themes/";
const MOODS = ["nyx", "aurora", "eclipse", "nebula", "midnight", "rose", "ember", "mono"];
const URLS = MOODS.map(m => `${BASE}${m === "nyx" ? "nyx" : `nyx-${m}`}.theme.css`);
const NYX_URL = `${BASE}nyx.theme.css`;
const FLAG = "NyxcordThemes_installed";

const logger = new Logger("NyxcordThemes");

async function installThemes() {
    if (await get(FLAG)) return;

    const links = Settings.themeLinks ?? [];
    const missing = URLS.filter(u => !links.includes(u));
    if (missing.length)
        Settings.themeLinks = [...links, ...missing];

    // Turn Nyx on, but only if the user hasn't already enabled one of the moods.
    const enabled = Settings.enabledThemeLinks ?? [];
    if (!enabled.some(u => URLS.includes(u)))
        Settings.enabledThemeLinks = [...enabled, NYX_URL];

    await set(FLAG, true);
    logger.info("Installed Nyx mood themes into the Themes tab.");
}

export default definePlugin({
    name: "NyxcordThemes",
    description: "Installs the Nyx mood themes into your Themes tab. Pick a mood there.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,

    async start() {
        await installThemes();
    }
});
