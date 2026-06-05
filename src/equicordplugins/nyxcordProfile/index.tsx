/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BadgePosition, ProfileBadge } from "@api/Badges";
import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { UserStore } from "@webpack/common";

const ICON = (hash: string) => `https://cdn.discordapp.com/badge-icons/${hash}.png`;

const BADGES = [
    { key: "staff", name: "Discord Staff", hash: "5e74e9b61934fc1f67c65515d1f7e60d" },
    { key: "partner", name: "Partner", hash: "3f9748e53446a137a052f3454e2de41e" },
    { key: "moderator", name: "Moderator Programs Alumni", hash: "fee1624003e2fee35cb398e125dc479b" },
    { key: "hypesquadEvents", name: "HypeSquad Events", hash: "bf01d1073931f921909045f3a39fd264" },
    { key: "bravery", name: "HypeSquad Bravery", hash: "8a88d63823d8a71cd5e390baa45efa02" },
    { key: "brilliance", name: "HypeSquad Brilliance", hash: "011940fd013da3f7fb926e4a1cd2e618" },
    { key: "balance", name: "HypeSquad Balance", hash: "3aa41de486fa12454c3761e8e223442e" },
    { key: "bugHunter", name: "Bug Hunter", hash: "2717692c7dca7289b35297368a940dd0" },
    { key: "bugHunterGold", name: "Bug Hunter (Gold)", hash: "848f79194d4be5ff5f81505cbd0ce1e6" },
    { key: "earlySupporter", name: "Early Supporter", hash: "7060786766c9c840eb3019e725d2b358" },
    { key: "verifiedDev", name: "Early Verified Bot Developer", hash: "6df5892e0f35b051f8b61eace34f4967" },
    { key: "activeDev", name: "Active Developer", hash: "6bdc42827a38498929a4920da12695d9" }
] as const;

const settings = definePluginSettings({
    staff: { type: OptionType.BOOLEAN, description: "Show the Discord Staff badge on your own profile.", default: false },
    partner: { type: OptionType.BOOLEAN, description: "Show the Partner badge on your own profile.", default: false },
    moderator: { type: OptionType.BOOLEAN, description: "Show the Moderator Programs Alumni badge on your own profile.", default: false },
    hypesquadEvents: { type: OptionType.BOOLEAN, description: "Show the HypeSquad Events badge on your own profile.", default: false },
    bravery: { type: OptionType.BOOLEAN, description: "Show the HypeSquad Bravery badge on your own profile.", default: false },
    brilliance: { type: OptionType.BOOLEAN, description: "Show the HypeSquad Brilliance badge on your own profile.", default: false },
    balance: { type: OptionType.BOOLEAN, description: "Show the HypeSquad Balance badge on your own profile.", default: false },
    bugHunter: { type: OptionType.BOOLEAN, description: "Show the Bug Hunter badge on your own profile.", default: false },
    bugHunterGold: { type: OptionType.BOOLEAN, description: "Show the gold Bug Hunter badge on your own profile.", default: false },
    earlySupporter: { type: OptionType.BOOLEAN, description: "Show the Early Supporter badge on your own profile.", default: false },
    verifiedDev: { type: OptionType.BOOLEAN, description: "Show the Early Verified Bot Developer badge on your own profile.", default: false },
    activeDev: { type: OptionType.BOOLEAN, description: "Show the Active Developer badge on your own profile.", default: false }
});

type BadgeKey = (typeof BADGES)[number]["key"];

const profileBadges: ProfileBadge[] = BADGES.map(badge => ({
    id: `nyxcord_fake_${badge.key}`,
    description: badge.name,
    iconSrc: ICON(badge.hash),
    position: BadgePosition.START,
    shouldShow: ({ userId }) => userId === UserStore.getCurrentUser()?.id && settings.store[badge.key as BadgeKey]
}));

export default definePlugin({
    name: "NyxcordProfile",
    description: "Wear any of the OG Discord badges (Staff, Partner, HypeSquad, Nitro-era and more) on your own profile. Only you see them; your real account is untouched.",
    authors: [EquicordDevs.Saxx],
    tags: ["Appearance", "Customisation", "Fun"],
    dependencies: ["BadgeAPI"],
    settings,
    userProfileBadges: profileBadges
});
