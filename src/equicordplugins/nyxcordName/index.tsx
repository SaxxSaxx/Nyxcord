/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import type { User } from "@vencord/discord-types";
import { UserStore } from "@webpack/common";

const settings = definePluginSettings({
    name: {
        type: OptionType.STRING,
        description: "The custom display name to show on your own profile, popout and account panel. Leave blank to use your real name.",
        default: ""
    }
});

export default definePlugin({
    name: "NyxcordName",
    description: "Show a custom display name on your own profile, popout and account panel. Experimental and client-side only, so only you see it and your real account is untouched.",
    authors: [EquicordDevs.Saxx],
    tags: ["Appearance", "Fun"],
    settings,

    patches: [
        {
            // Profile modal / card.
            find: "DISPLAY_NAME",
            replacement: {
                match: /(?<=currentUser:\i,user:)(\i)/,
                replace: "$self.fakeUser($1)"
            },
            noWarn: true
        },
        {
            // Account panel (bottom left).
            find: "AccountPanel",
            replacement: {
                match: /user:(\i),/,
                replace: "user:$self.fakeUser($1),"
            },
            noWarn: true
        },
        {
            // User profile popout (on hover).
            find: "isHoveringOrFocusing",
            replacement: {
                match: /user:(\i),displayProfile:(\i),themeType/,
                replace: "user:$self.fakeUser($1),displayProfile:$2,themeType"
            },
            noWarn: true
        }
    ],

    fakeUser(user: User): User {
        try {
            const name = settings.store.name.trim();
            if (!name || !user) return user;

            const me = UserStore.getCurrentUser();
            if (!me || user.id !== me.id) return user;

            const clone: User = Object.assign(Object.create(Object.getPrototypeOf(user)), user);
            Object.defineProperty(clone, "globalName", {
                get: () => name,
                set: () => { },
                configurable: true,
                enumerable: true
            });
            return clone;
        } catch {
            return user;
        }
    }
});
