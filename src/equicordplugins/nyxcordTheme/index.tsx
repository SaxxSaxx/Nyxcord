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

// The Nyx theme lives in the Themes tab as online "mood" themes. This invisible
// installer keeps the list current: 8 flat moods + the 8-mood Glass family
// (v0.14.0). Fresh installs boot into glass Nyx; existing installs keep their
// saved pick. Nyx Deep v1 is superseded by the Glass family — its entry is
// retired unless the user actively runs it (the file stays hosted).

const BASE = "https://saxxsaxx.github.io/Nyxcord/themes/";
const FLAT_MOODS = ["nyx", "aurora", "eclipse", "nebula", "midnight", "rose", "ember", "mono"];
const GLASS_MOODS = ["nyx-glass", "nyx-glass-aurora", "nyx-glass-eclipse", "nyx-glass-nebula", "nyx-glass-midnight", "nyx-glass-rose", "nyx-glass-ember", "nyx-glass-mono"];

export const FLAT_URLS = FLAT_MOODS.map(m => `${BASE}${m === "nyx" ? "nyx" : `nyx-${m}`}.theme.css`);
export const GLASS_URLS = GLASS_MOODS.map(m => `${BASE}${m}.theme.css`);
const URLS = [...FLAT_URLS, ...GLASS_URLS];
const DEEP_URL = `${BASE}nyx-deep.theme.css`;

/** Fresh installs boot into this (glass Nyx). */
export const DEFAULT_URL = `${BASE}nyx-glass.theme.css`;
/** The Welcome modal's "classic look" swaps to this (flat Nyx). */
export const CLASSIC_URL = `${BASE}nyx.theme.css`;

const FLAG = "NyxcordThemes_installed";

const logger = new Logger("NyxcordThemes");

async function installThemes() {
    const enabled = Settings.enabledThemeLinks ?? [];
    let links = Settings.themeLinks ?? [];

    // Retire the superseded Nyx Deep v1 entry — unless the user actively runs it.
    if (!enabled.includes(DEEP_URL) && links.includes(DEEP_URL))
        links = links.filter(u => u !== DEEP_URL);

    // Ensure every current mood is in the Themes tab (new moods appear on update).
    const missing = URLS.filter(u => !links.includes(u));
    if (missing.length || links !== Settings.themeLinks)
        Settings.themeLinks = [...links, ...missing];

    // Auto-enable glass Nyx only once, and only if no Nyx mood is already picked.
    if (!(await get(FLAG))) {
        if (!enabled.some(u => URLS.includes(u) || u === DEEP_URL))
            Settings.enabledThemeLinks = [...enabled, DEFAULT_URL];
        await set(FLAG, true);
    }

    if (missing.length)
        logger.info(`Installed ${missing.length} Nyx mood theme(s) into the Themes tab.`);
}

export default definePlugin({
    name: "NyxcordThemes",
    description: "Installs the Nyx mood themes (flat + Glass) into your Themes tab. Pick a mood there.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,

    async start() {
        await installThemes();
    }
});
