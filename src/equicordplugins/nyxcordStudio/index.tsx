/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { get, set } from "@api/DataStore";
import { FormSwitch } from "@components/FormSwitch";
import SettingsPlugin from "@plugins/_core/settings";
import { EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { removeFromArray } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import definePlugin, { makeRange, StartAt } from "@utils/types";
import { Button, Slider, useState } from "@webpack/common";

const cl = classNameFactory("vc-nyxstudio-");
const KEY = "NyxcordStudio";
const NYX_VARS = ["--nyx-accent-h", "--nyx-glow", "--nyx-star-opacity", "--nyx-bg-h", "--nyx-bg-s"];

interface Studio {
    active: boolean;
    accentHue: number;
    glow: number;
    starfield: boolean;
    bgHue: number;
    bgSat: number;
}

type NumberKey = "accentHue" | "glow" | "bgHue" | "bgSat";

const DEFAULTS: Studio = { active: false, accentHue: 270, glow: 45, starfield: true, bgHue: 258, bgSat: 30 };
let studio: Studio = { ...DEFAULTS };

const persist = () => set(KEY, studio);

function applyVars() {
    const root = document.documentElement.style;
    if (!studio.active) {
        for (const v of NYX_VARS) root.removeProperty(v);
        return;
    }
    root.setProperty("--nyx-accent-h", String(studio.accentHue));
    root.setProperty("--nyx-glow", String(studio.glow / 100));
    root.setProperty("--nyx-star-opacity", studio.starfield ? "1" : "0");
    root.setProperty("--nyx-bg-h", String(studio.bgHue));
    root.setProperty("--nyx-bg-s", `${studio.bgSat}%`);
}

function StudioIcon(props: { width?: string | number; height?: string | number; }) {
    return (
        <svg width={props.width ?? 24} height={props.height ?? 24} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13 8 16 11 22 12C16 13 13 16 12 22C11 16 8 13 2 12C8 11 11 8 12 2Z" />
        </svg>
    );
}

function StudioTab() {
    const forceUpdate = useForceUpdater();
    // Bumped to remount the sliders (which are uncontrolled) after a reset.
    const [version, setVersion] = useState(0);

    function setActive(value: boolean) {
        studio.active = value;
        persist();
        applyVars();
        forceUpdate();
    }

    function setNumber(key: NumberKey, value: number) {
        studio[key] = Math.round(value);
        persist();
        applyVars();
    }

    function setStarfield(value: boolean) {
        studio.starfield = value;
        persist();
        applyVars();
    }

    function reset() {
        studio = { ...DEFAULTS, active: studio.active };
        persist();
        applyVars();
        setVersion(v => v + 1);
    }

    const slider = (key: NumberKey, label: string, max: number, step: number) => (
        <div key={key}>
            <div className={cl("label")}>{label}</div>
            <Slider
                minValue={0}
                maxValue={max}
                initialValue={studio[key]}
                markers={makeRange(0, max, step)}
                stickToMarkers={false}
                onValueChange={(v: number) => setNumber(key, v)}
            />
        </div>
    );

    return (
        <div className={cl("root")}>
            <div className={cl("intro")}>
                Tune your own Nyx look. With this on, your sliders override whichever mood is active, and it sticks across restarts.
            </div>

            <FormSwitch
                title="Use my custom look"
                description="Override the active Nyx mood with the sliders below. Turn off to go back to the plain mood."
                value={studio.active}
                onChange={setActive}
            />

            <div className={cl("controls")} data-disabled={!studio.active} key={version}>
                {slider("accentHue", "Accent hue", 360, 30)}
                {slider("glow", "Glow", 100, 25)}
                {slider("bgHue", "Background hue", 360, 30)}
                {slider("bgSat", "Background saturation", 60, 10)}
                <FormSwitch title="Starfield" value={studio.starfield} onChange={setStarfield} hideBorder />
            </div>

            <Button color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={reset}>
                Reset to Nyx
            </Button>
        </div>
    );
}

export default definePlugin({
    name: "NyxcordStudio",
    description: "Tune your own Nyx theme look with live sliders for accent, glow, background and starfield.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,
    startAt: StartAt.DOMContentLoaded,

    async start() {
        studio = { ...DEFAULTS, ...(await get<Studio>(KEY)) };
        applyVars();
        SettingsPlugin.customEntries.push({
            key: "nyxcord_studio",
            title: "Theme Studio",
            Component: StudioTab,
            Icon: StudioIcon
        });
    },

    stop() {
        removeFromArray(SettingsPlugin.customEntries, e => e.key === "nyxcord_studio");
        for (const v of NYX_VARS) document.documentElement.style.removeProperty(v);
    }
});
