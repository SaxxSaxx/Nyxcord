/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { get, set } from "@api/DataStore";
import { Paragraph } from "@components/Paragraph";
import { EquicordDevs } from "@utils/constants";
import { Margins } from "@utils/margins";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { RenderModalProps } from "@vencord/discord-types";
import { Modal } from "@webpack/common";

const SEEN_KEY = "NyxcordWelcome_seen";

function WelcomeModal({ modalProps }: { modalProps: RenderModalProps; }) {
    return (
        <Modal
            {...modalProps}
            size="md"
            title="Welcome to Nyxcord"
            actions={[{ text: "Enter the night", variant: "primary", onClick: modalProps.onClose }]}
        >
            <Paragraph className={Margins.bottom16}>
                Nyxcord is Discord with a face of its own. Here is what is already on.
            </Paragraph>
            <Paragraph className={Margins.bottom8}>
                <strong>Signature theme.</strong> The Nyx night sky is enabled by default, with four moods: Nyx, Aurora, Eclipse, and Nebula. Change the mood, accent, glow, and starfield under Settings, then Nyxcord, then Plugins, then NyxcordTheme.
            </Paragraph>
            <Paragraph className={Margins.bottom8}>
                <strong>Private by default.</strong> Analytics and Sentry are blocked, your typing indicator is hidden, and deleted messages stay visible.
            </Paragraph>
            <Paragraph>
                <strong>Make it yours.</strong> The full plugin library is one click away in settings. Welcome under the night sky.
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
