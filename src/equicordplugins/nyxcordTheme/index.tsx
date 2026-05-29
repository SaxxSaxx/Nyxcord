/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { makeRange, OptionType, StartAt } from "@utils/types";

import styles from "./styles.css?managed";

const NYX_VARS = ["--nyx-accent-h", "--nyx-accent-s", "--nyx-accent-l", "--nyx-glow", "--nyx-star-opacity"];

function applyVars() {
    const { accentHue, glow, starfield } = settings.store;
    const root = document.documentElement.style;

    root.setProperty("--nyx-accent-h", String(accentHue));
    root.setProperty("--nyx-accent-s", "85%");
    root.setProperty("--nyx-accent-l", "63%");
    root.setProperty("--nyx-glow", String(glow / 100));
    root.setProperty("--nyx-star-opacity", starfield ? "1" : "0");
}

function clearVars() {
    const root = document.documentElement.style;
    for (const name of NYX_VARS)
        root.removeProperty(name);
}

const settings = definePluginSettings({
    accentHue: {
        type: OptionType.SLIDER,
        description: "Accent hue. 270 is Nyx violet. Slide toward 240 for indigo or 300 for magenta.",
        markers: makeRange(0, 360, 30),
        default: 270,
        stickToMarkers: false,
        onChange: applyVars
    },
    glow: {
        type: OptionType.SLIDER,
        description: "Strength of the nebula glow on links, mentions, the selected channel, and primary buttons.",
        markers: makeRange(0, 100, 25),
        default: 45,
        stickToMarkers: false,
        onChange: applyVars
    },
    starfield: {
        type: OptionType.BOOLEAN,
        description: "Faint starfield behind the app, like standing under the night sky.",
        default: true,
        onChange: applyVars
    }
});

export default definePlugin({
    name: "NyxcordTheme",
    description: "Nyxcord's signature theme. A cosmic, void violet night sky with a nebula glow and an optional starfield.",
    authors: [EquicordDevs.Saxx],
    tags: ["Appearance", "Customisation"],
    enabledByDefault: true,
    settings,

    startAt: StartAt.DOMContentLoaded,
    start() {
        applyVars();
        enableStyle(styles);
    },
    stop() {
        disableStyle(styles);
        clearVars();
    }
});
