/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { EquicordDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { showToast, Toasts } from "@webpack/common";

import { getProfiles, type Persona, setProfile } from "./api";

const logger = new Logger("NyxcordSync");

// Cache of other users' personas, filled by a debounced batch fetch as they're seen.
const personas = new Map<string, Persona | null>();
const pending = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function flush() {
    flushTimer = undefined;
    const ids = [...pending].slice(0, 100);
    pending.clear();
    if (!ids.length) return;
    getProfiles(settings.store.apiUrl, ids)
        .then(res => {
            for (const id of ids) personas.set(id, res[id] ?? null);
        })
        .catch(e => logger.error("Failed to fetch personas.", e));
}

function ensurePersona(id: string) {
    if (personas.has(id) || pending.has(id)) return;
    pending.add(id);
    if (!flushTimer) flushTimer = setTimeout(flush, 500);
}

function ConnectButton() {
    return (
        <Button onClick={() => VencordNative.native.openExternal(`${settings.store.apiUrl}/auth/discord`)}>
            Connect with Discord
        </Button>
    );
}

function SaveButton() {
    return (
        <Button
            onClick={async () => {
                const { apiUrl, token, displayName, color } = settings.store;
                if (!token) {
                    showToast("Connect with Discord first, then paste your token above.", Toasts.Type.FAILURE);
                    return;
                }
                try {
                    await setProfile(apiUrl, token, displayName, color);
                    showToast("Saved your Nyxcord persona.", Toasts.Type.SUCCESS);
                } catch (e) {
                    showToast(e instanceof Error ? e.message : "Could not save persona.", Toasts.Type.FAILURE);
                }
            }}
        >
            Save persona
        </Button>
    );
}

const settings = definePluginSettings({
    apiUrl: {
        type: OptionType.STRING,
        description: "Nyxcord Sync server URL.",
        default: "https://sync.alphafeed.site"
    },
    displayName: {
        type: OptionType.STRING,
        description: "Your custom display name (1 to 32 characters), shown to other Nyxcord users.",
        default: ""
    },
    color: {
        type: OptionType.STRING,
        description: "Your name color, as a hex value like #a855f7.",
        default: "#a855f7"
    },
    connect: {
        type: OptionType.COMPONENT,
        description: "Connect your Discord account, then paste the token below.",
        component: ConnectButton
    },
    token: {
        type: OptionType.STRING,
        description: "Paste the token from the connect page here.",
        default: ""
    },
    save: {
        type: OptionType.COMPONENT,
        description: "Save your display name and color.",
        component: SaveButton
    }
});

export default definePlugin({
    name: "NyxcordSync",
    description: "Sets a custom display name and color that other Nyxcord users see, synced through the free Nyxcord server. Your real Discord profile is untouched.",
    authors: [EquicordDevs.Saxx],
    settings,

    patches: [
        {
            // Overlay a synced user's color on their message author name. Mirrors CustomUserColors.
            find: '="SYSTEM_TAG"',
            replacement: {
                match: /(?<=colorString:\i,colorStrings:\i,colorRoleName:\i.*?}=)(\i),/,
                replace: "$self.wrapColor($1,arguments[0]),"
            },
            noWarn: true
        }
    ],

    wrapColor(colorProps: { colorString: string; colorStrings?: Record<string, string | undefined>; }, context: any) {
        try {
            const id = context?.message?.author?.id;
            if (!id) return colorProps;
            const persona = personas.get(id);
            if (persona === undefined) {
                ensurePersona(id);
                return colorProps;
            }
            if (!persona) return colorProps;
            return {
                ...colorProps,
                colorString: persona.color,
                colorStrings: colorProps.colorStrings && {
                    primaryColor: persona.color,
                    secondaryColor: undefined,
                    tertiaryColor: undefined
                }
            };
        } catch (e) {
            logger.error("wrapColor failed.", e);
            return colorProps;
        }
    },

    stop() {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = undefined;
        }
        personas.clear();
        pending.clear();
    }
});
