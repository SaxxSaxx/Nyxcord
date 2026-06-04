/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { Settings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import { relaunch } from "@utils/native";
import definePlugin from "@utils/types";
import { Alerts } from "@webpack/common";

import { PRESETS } from "../nyxcordPresets";

const BASE = "https://saxxsaxx.github.io/Nyxcord/themes/";
const MOODS = [
    { value: "nyx", label: "Nyx" },
    { value: "aurora", label: "Aurora" },
    { value: "eclipse", label: "Eclipse" },
    { value: "nebula", label: "Nebula" },
    { value: "midnight", label: "Midnight" },
    { value: "rose", label: "Rose" },
    { value: "ember", label: "Ember" },
    { value: "mono", label: "Mono" },
    { value: "deep", label: "Nyx Deep" }
];
const urlFor = (mood: string) => `${BASE}${mood === "nyx" ? "nyx" : `nyx-${mood}`}.theme.css`;
const ALL_URLS = MOODS.map(m => urlFor(m.value));

function switchMood(mood: string) {
    const url = urlFor(mood);
    const links = Settings.themeLinks ?? [];
    if (!links.includes(url))
        Settings.themeLinks = [...links, url];
    // Enable only this mood, dropping any other Nyx mood.
    Settings.enabledThemeLinks = [...(Settings.enabledThemeLinks ?? []).filter(u => !ALL_URLS.includes(u)), url];
}

export default definePlugin({
    name: "NyxcordCommands",
    description: "Quick Nyxcord slash commands: switch theme moods and apply presets from chat.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,

    commands: [
        {
            name: "nyx-mood",
            description: "Switch the Nyx theme mood instantly.",
            options: [
                {
                    name: "mood",
                    description: "Which mood to switch to, or random.",
                    type: ApplicationCommandOptionType.STRING,
                    required: true,
                    choices: [
                        ...MOODS.map(m => ({ name: m.label, label: m.label, value: m.value })),
                        { name: "Random", label: "Random", value: "random" }
                    ]
                }
            ],
            execute(args, ctx) {
                let mood: string = findOption(args, "mood", "nyx");
                if (mood === "random")
                    mood = MOODS[Math.floor(Math.random() * MOODS.length)].value;

                switchMood(mood);
                const label = MOODS.find(m => m.value === mood)?.label ?? mood;
                sendBotMessage(ctx.channel.id, { content: `Switched to the **${label}** mood.` });
            }
        },
        {
            name: "nyx-preset",
            description: "Apply a Nyxcord preset bundle.",
            options: [
                {
                    name: "preset",
                    description: "Which vibe to set up.",
                    type: ApplicationCommandOptionType.STRING,
                    required: true,
                    choices: PRESETS.map(p => ({ name: p.name, label: p.name, value: p.id }))
                }
            ],
            execute(args, ctx) {
                const id = findOption(args, "preset", "");
                const preset = PRESETS.find(p => p.id === id);
                if (!preset) {
                    sendBotMessage(ctx.channel.id, { content: "That preset doesn't exist." });
                    return;
                }
                Alerts.show({
                    title: `Apply the ${preset.name} preset?`,
                    body: `This turns on ${preset.plugins.length} plugins, then restarts Discord to apply them.`,
                    confirmText: "Apply and restart",
                    cancelText: "Not now",
                    onConfirm() {
                        for (const name of preset.plugins) {
                            const pluginSettings = Settings.plugins[name];
                            if (pluginSettings) pluginSettings.enabled = true;
                        }
                        relaunch();
                    }
                });
            }
        }
    ]
});
