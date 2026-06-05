/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { set } from "@api/DataStore";
import { Settings } from "@api/Settings";
import { FormSwitch } from "@components/FormSwitch";
import { colors as userColors, DATASTORE_KEY as COLORS_KEY } from "@equicordplugins/customUserColors";
import SettingsPlugin from "@plugins/_core/settings";
import { EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { removeFromArray } from "@utils/misc";
import { relaunch } from "@utils/native";
import { useForceUpdater } from "@utils/react";
import definePlugin from "@utils/types";
import { Button, ColorPicker, TextInput, UserStore, useState } from "@webpack/common";

import { PRESETS } from "../nyxcordPresets";
import { BADGES } from "../nyxcordProfile";

const cl = classNameFactory("vc-nyxpe-");

function badgeValue(key: string): boolean {
    return Boolean(Settings.plugins.NyxcordProfile?.[key]);
}

function ProfileEditor() {
    const forceUpdate = useForceUpdater();
    const me = UserStore.getCurrentUser()?.id ?? "";
    const [name, setName] = useState<string>(String(Settings.plugins.NyxcordName?.name ?? ""));
    const [color, setColor] = useState<number>(parseInt((me && userColors[me]) || "a855f7", 16));

    function setBadge(key: string, value: boolean) {
        Settings.plugins.NyxcordProfile[key] = value;
        forceUpdate();
    }

    async function apply() {
        // Display name -> NyxcordName
        if (name.trim()) {
            Settings.plugins.NyxcordName.name = name.trim();
            Settings.plugins.NyxcordName.enabled = true;
        }
        // Name color -> CustomUserColors (your own id)
        if (me) {
            userColors[me] = color.toString(16).padStart(6, "0");
            await set(COLORS_KEY, userColors);
            Settings.plugins.CustomUserColors.enabled = true;
        }
        // Badges -> NyxcordProfile
        Settings.plugins.NyxcordProfile.enabled = true;
        relaunch();
    }

    function enablePersona() {
        const persona = PRESETS.find(p => p.id === "persona");
        if (!persona) return;
        for (const n of persona.plugins) {
            const s = Settings.plugins[n];
            if (s) s.enabled = true;
        }
        relaunch();
    }

    return (
        <div className={cl("root")}>
            <div className={cl("intro")}>
                Your Nyxcord profile in one place. Set it here, then hit Apply. It restarts Discord so everything takes effect.
            </div>

            <div>
                <div className={cl("section-label")}>Display name</div>
                <TextInput value={name} onChange={setName} placeholder="Leave blank to keep your real name" />
            </div>

            <div>
                <div className={cl("section-label")}>Name color</div>
                <ColorPicker color={color} onChange={(c: number) => setColor(c)} showEyeDropper={false} />
            </div>

            <div>
                <div className={cl("section-label")}>Badges</div>
                <div className={cl("badges")}>
                    {BADGES.map(badge => (
                        <FormSwitch
                            key={badge.key}
                            title={badge.name}
                            value={badgeValue(badge.key)}
                            onChange={v => setBadge(badge.key, v)}
                            hideBorder
                        />
                    ))}
                </div>
            </div>

            <div>
                <div className={cl("section-label")}>Avatar &amp; banner</div>
                <div className={cl("note")}>
                    Custom avatar, banner and decoration come from the open ecosystems (UserPFP, USRBG, Decor), and those are the parts other Nyxcord users actually see. The button below turns on the whole Persona bundle so you can set them.
                </div>
            </div>

            <div className={cl("note")}>
                Heads up: your name, color and badges are shown on <strong>your</strong> client. Avatar, banner and decoration sync to other Nyxcord users. Syncing your custom <strong>name</strong> to others needs the Nyxcord server (one DNS record away).
            </div>

            <div className={cl("actions")}>
                <Button onClick={apply}>Apply &amp; restart</Button>
                <Button color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={enablePersona}>Set up avatar &amp; banner</Button>
            </div>
        </div>
    );
}

function ProfileIcon(props: { width?: string | number; height?: string | number; }) {
    return (
        <svg width={props.width ?? 24} height={props.height ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
        </svg>
    );
}

export default definePlugin({
    name: "NyxcordProfileEditor",
    description: "Edit your whole Nyxcord profile (name, color, badges, avatar) in one place.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,

    start() {
        SettingsPlugin.customEntries.push({
            key: "nyxcord_profile_editor",
            title: "Profile",
            Component: ProfileEditor,
            Icon: ProfileIcon
        });
    },

    stop() {
        removeFromArray(SettingsPlugin.customEntries, e => e.key === "nyxcord_profile_editor");
    }
});
