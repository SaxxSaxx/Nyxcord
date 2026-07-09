/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { get, set } from "@api/DataStore";
import { Settings } from "@api/Settings";
import { Paragraph } from "@components/Paragraph";
import { EquicordDevs } from "@utils/constants";
import { Margins } from "@utils/margins";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal, SettingsRouter } from "@webpack/common";

import { CLASSIC_URL, GLASS_URLS } from "../nyxcordTheme";

const SEEN_KEY = "NyxcordWelcome_seen";

function applyClassicLook() {
    const enabled = Settings.enabledThemeLinks ?? [];
    Settings.enabledThemeLinks = [...enabled.filter(u => !GLASS_URLS.includes(u)), CLASSIC_URL];
}

function WelcomeModal({ modalProps }: { modalProps: RenderModalProps; }) {
    return (
        <Modal
            {...modalProps}
            size="md"
            title="Welcome to Nyxcord"
            actions={[
                {
                    text: "Pick a preset",
                    variant: "primary",
                    onClick: () => {
                        modalProps.onClose();
                        SettingsRouter.openUserSettings("nyxcord_presets_panel");
                    }
                },
                {
                    text: "Prefer the classic look?",
                    variant: "secondary",
                    onClick: () => {
                        applyClassicLook();
                        modalProps.onClose();
                    }
                },
                { text: "Maybe later", variant: "secondary", onClick: modalProps.onClose }
            ]}
        >
            <Paragraph className={Margins.bottom16}>
                Nyxcord is Discord with a face of its own. Here is what is already on.
            </Paragraph>
            <Paragraph className={Margins.bottom8}>
                <strong>One-click presets.</strong> Set Nyxcord up for a vibe in a tap, Privacy, Persona, Power QoL, or Streamer, under Settings, then Nyxcord, then Presets. Hit the button below to browse them now.
            </Paragraph>
            <Paragraph className={Margins.bottom8}>
                <strong>Signature theme.</strong> You are looking at Nyx Glass, frosted panels over a living nebula, with eight moods (plus eight classic flat moods). Pick one under Settings, then Themes, or take the classic look below.
            </Paragraph>
            <Paragraph>
                <strong>Private by default.</strong> Analytics and Sentry are blocked, your typing indicator is hidden, and deleted messages stay visible.
            </Paragraph>
        </Modal>
    );
}

export default definePlugin({
    name: "NyxcordWelcome",
    description: "Shows a one time welcome the first time Nyxcord starts.",
    authors: [EquicordDevs.Saxx],
    enabledByDefault: true,

    async start() {
        if (await get(SEEN_KEY)) return;
        await set(SEEN_KEY, true);
        openModal(modalProps => <WelcomeModal modalProps={modalProps} />);
    }
});
