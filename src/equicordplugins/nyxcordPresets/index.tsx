/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Settings } from "@api/Settings";
import { Button } from "@components/Button";
import SettingsPlugin from "@plugins/_core/settings";
import { EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { removeFromArray } from "@utils/misc";
import { relaunch } from "@utils/native";
import definePlugin from "@utils/types";
import { Alerts } from "@webpack/common";

const cl = classNameFactory("vc-nyxpresets-");

interface Preset {
    id: string;
    name: string;
    description: string;
    plugins: string[];
}

const PRESETS: Preset[] = [
    {
        id: "privacy",
        name: "Privacy",
        description: "Lock it down: hide your typing, strip tracking from links, anonymise uploads, and keep deleted and edited messages.",
        plugins: ["SilentTyping", "AnonymiseFileNames", "ClearURLs", "NoBlockedMessages", "MessageLogger"]
    },
    {
        id: "persona",
        name: "Persona / LARP",
        description: "Become someone else: custom avatar, banner, decoration, name color and badges that other Nyxcord users can see. Your real Discord profile stays untouched.",
        plugins: ["UserPFP", "USRBG", "Decor", "CustomUserColors", "FakeProfileThemes", "GlobalBadges", "ShowBadgesInChat", "MentionAvatars", "BannersEverywhere"]
    },
    {
        id: "qol",
        name: "Power QoL",
        description: "The quality-of-life upgrades power users keep on: image zoom, platform icons, pinned DMs, click-to-view icons, reverse image search and more.",
        plugins: ["PlatformIndicators", "TypingTweaks", "ImageZoom", "ViewIcons", "ReverseImageSearch", "PinDMs", "ReadAllNotificationsButton", "MoreUserTags"]
    },
    {
        id: "streamer",
        name: "Streamer",
        description: "Go live safely: hide personal info and anonymise file names while you're streaming.",
        plugins: ["StreamerModeOn", "AnonymiseFileNames"]
    }
];

function applyPreset(preset: Preset) {
    Alerts.show({
        title: `Apply the ${preset.name} preset?`,
        body: `This turns on ${preset.plugins.length} plugins, then restarts Discord to apply them. You can fine-tune or turn any of them off afterward.`,
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

function NyxSparkle(props: { width?: string | number; height?: string | number; }) {
    return (
        <svg width={props.width} height={props.height} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13 8 16 11 22 12C16 13 13 16 12 22C11 16 8 13 2 12C8 11 11 8 12 2Z" />
        </svg>
    );
}

function PresetsTab() {
    return (
        <div className={cl("root")}>
            <div className={cl("intro")}>
                One click sets up Nyxcord for a vibe. It turns the matching plugins on and restarts Discord. Nothing is locked in, you can change anything afterward.
            </div>
            {PRESETS.map(preset => (
                <div className={cl("card")} key={preset.id}>
                    <div className={cl("body")}>
                        <div className={cl("name")}>{preset.name}</div>
                        <div className={cl("desc")}>{preset.description}</div>
                        <div className={cl("count")}>{preset.plugins.length} plugins</div>
                    </div>
                    <Button onClick={() => applyPreset(preset)}>Apply</Button>
                </div>
            ))}
        </div>
    );
}

export default definePlugin({
    name: "NyxcordPresets",
    description: "One-click preset bundles that set Nyxcord up for privacy, persona, QoL, or streaming.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,

    start() {
        SettingsPlugin.customEntries.push({
            key: "nyxcord_presets",
            title: "Presets",
            Component: PresetsTab,
            Icon: NyxSparkle
        });
    },

    stop() {
        removeFromArray(SettingsPlugin.customEntries, e => e.key === "nyxcord_presets");
    }
});
