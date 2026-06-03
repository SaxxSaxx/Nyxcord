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

const NYX_VARS = ["--nyx-bg-h", "--nyx-bg-s", "--nyx-accent-h", "--nyx-accent-s", "--nyx-accent-l", "--nyx-glow", "--nyx-star-opacity"];

interface Variant {
    accentHue: number;
    glow: number;
    starfield: boolean;
    bgHue: number;
    bgSat: number;
}

const VARIANTS: Record<string, Variant> = {
    // Void violet. The default Nyx night sky.
    nyx: { accentHue: 270, glow: 45, starfield: true, bgHue: 258, bgSat: 30 },
    // Teal shimmer. Cooler, brighter, northern-lights mood.
    aurora: { accentHue: 160, glow: 60, starfield: true, bgHue: 205, bgSat: 32 },
    // Austere near-mono indigo. Quiet, low glow, no stars.
    eclipse: { accentHue: 250, glow: 20, starfield: false, bgHue: 245, bgSat: 16 },
    // Magenta nebula. Vibrant, high glow.
    nebula: { accentHue: 305, glow: 70, starfield: true, bgHue: 268, bgSat: 34 },
    // Deep blue night. Classic, calm.
    midnight: { accentHue: 222, glow: 40, starfield: true, bgHue: 222, bgSat: 38 },
    // Rose dusk. Soft pink over a plum base.
    rose: { accentHue: 335, glow: 55, starfield: true, bgHue: 320, bgSat: 26 },
    // Warm ember. Amber over a cocoa base, no stars.
    ember: { accentHue: 25, glow: 50, starfield: false, bgHue: 20, bgSat: 24 },
    // Minimalist mono. Near-grayscale, faint accent, quiet.
    mono: { accentHue: 250, glow: 10, starfield: false, bgHue: 240, bgSat: 6 }
};

function applyVars() {
    const { variant, accentHue, glow, starfield } = settings.store;
    const v = VARIANTS[variant] ?? VARIANTS.nyx;
    const root = document.documentElement.style;

    root.setProperty("--nyx-bg-h", String(v.bgHue));
    root.setProperty("--nyx-bg-s", `${v.bgSat}%`);
    root.setProperty("--nyx-accent-h", String(accentHue));
    root.setProperty("--nyx-accent-s", "85%");
    root.setProperty("--nyx-accent-l", "63%");
    root.setProperty("--nyx-glow", String(glow / 100));
    root.setProperty("--nyx-star-opacity", starfield ? "1" : "0");
}

function applyVariant(variant: string) {
    const v = VARIANTS[variant] ?? VARIANTS.nyx;
    settings.store.accentHue = v.accentHue;
    settings.store.glow = v.glow;
    settings.store.starfield = v.starfield;
    applyVars();
}

function clearVars() {
    const root = document.documentElement.style;
    for (const name of NYX_VARS)
        root.removeProperty(name);
}

const settings = definePluginSettings({
    variant: {
        type: OptionType.SELECT,
        description: "Mood preset. Picking one sets the accent, glow, background tint, and starfield. Fine-tune them below afterward.",
        options: [
            { label: "Nyx — void violet", value: "nyx", default: true },
            { label: "Aurora — teal shimmer", value: "aurora" },
            { label: "Eclipse — austere indigo", value: "eclipse" },
            { label: "Nebula — magenta", value: "nebula" },
            { label: "Midnight — deep blue", value: "midnight" },
            { label: "Rose — pink dusk", value: "rose" },
            { label: "Ember — warm amber", value: "ember" },
            { label: "Mono — minimalist", value: "mono" }
        ],
        onChange: applyVariant
    },
    accentHue: {
        type: OptionType.SLIDER,
        description: "Accent hue. Slide to recolor links, mentions, the selected channel, and buttons.",
        markers: makeRange(0, 360, 30),
        default: 270,
        stickToMarkers: false,
        onChange: applyVars
    },
    glow: {
        type: OptionType.SLIDER,
        description: "Strength of the nebula glow on accent text.",
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
    description: "Nyxcord's signature theme. A cosmic night sky with eight moods, a nebula glow, and an optional starfield.",
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
