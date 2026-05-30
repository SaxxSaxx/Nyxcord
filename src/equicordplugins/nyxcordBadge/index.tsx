/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BadgePosition, ProfileBadge } from "@api/Badges";
import { EquicordDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

import { BRAND_REPO_NAME, BRAND_REPO_OWNER, BRAND_REPO_URL } from "../../nyxcord/branding";

const BADGES_URL = `https://raw.githubusercontent.com/${BRAND_REPO_OWNER}/${BRAND_REPO_NAME}/main/badges.json`;

// A violet cosmic sparkle, inline so the badge needs no extra host.
const NYX_ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23a855f7' d='M12 2C13 8 16 11 22 12C16 13 13 16 12 22C11 16 8 13 2 12C8 11 11 8 12 2Z'/></svg>";

const logger = new Logger("NyxcordBadge");

let badgeUsers: Record<string, string> = {};
let intervalId: ReturnType<typeof setInterval> | undefined;

async function loadBadges(noCache = false) {
    try {
        const init: RequestInit = noCache ? { cache: "no-cache" } : {};
        badgeUsers = await fetch(BADGES_URL, init).then(r => r.json());
    } catch (e) {
        logger.error("Failed to load Nyxcord badges.", e);
    }
}

const NyxcordBadge: ProfileBadge = {
    id: "nyxcord_user_badge",
    shouldShow: ({ userId }) => userId in badgeUsers,
    getBadges: ({ userId }) => [{
        id: "nyxcord_user_badge",
        description: badgeUsers[userId] || "Nyxcord user",
        iconSrc: NYX_ICON,
        position: BadgePosition.START,
        link: BRAND_REPO_URL,
        props: {
            style: {
                borderRadius: "50%",
                transform: "scale(0.9)"
            }
        }
    }]
};

export default definePlugin({
    name: "NyxcordBadge",
    description: "Shows a Nyxcord badge on Nyxcord users' profiles. The list is fetched from the Nyxcord repo.",
    authors: [EquicordDevs.Saxx],
    enabledByDefault: true,
    dependencies: ["BadgeAPI"],
    userProfileBadges: [NyxcordBadge],

    toolboxActions: {
        async "Refetch Nyxcord badges"() {
            await loadBadges(true);
            Toasts.show({
                id: Toasts.genId(),
                message: "Refetched Nyxcord badges.",
                type: Toasts.Type.SUCCESS
            });
        }
    },

    async start() {
        await loadBadges();
        clearInterval(intervalId);
        intervalId = setInterval(() => loadBadges(), 1000 * 60 * 30);
    },

    stop() {
        clearInterval(intervalId);
    }
});
