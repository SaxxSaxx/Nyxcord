/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { get, set } from "@api/DataStore";
import SettingsPlugin from "@plugins/_core/settings";
import { EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { removeFromArray } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import definePlugin from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { Button, ChannelStore, MessageActions, showToast, Toasts } from "@webpack/common";

const cl = classNameFactory("vc-nyxsaved-");
const KEY = "NyxcordSaved";

interface SavedMessage {
    channelId: string;
    messageId: string;
    author: string;
    content: string;
    savedAt: number;
}

let saved: SavedMessage[] = [];

(async () => {
    saved = (await get<SavedMessage[]>(KEY)) ?? [];
})();

const persist = () => set(KEY, saved);

function BookmarkIcon(props: { width?: string | number; height?: string | number; }) {
    return (
        <svg width={props.width ?? 24} height={props.height ?? 24} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
        </svg>
    );
}

function saveMessage(message: Message) {
    if (!message?.id) return;
    if (saved.some(s => s.messageId === message.id)) {
        showToast("Already saved to Nyxcord.", Toasts.Type.MESSAGE);
        return;
    }
    saved = [{
        channelId: message.channel_id,
        messageId: message.id,
        author: message.author?.username ?? "unknown",
        content: (message.content || "").slice(0, 140) || "(no text)",
        savedAt: Date.now()
    }, ...saved];
    persist();
    showToast("Saved to Nyxcord.", Toasts.Type.SUCCESS);
}

function jump(s: SavedMessage) {
    MessageActions.jumpToMessage({
        channelId: s.channelId,
        messageId: s.messageId,
        flash: true,
        jumpType: "INSTANT"
    });
}

function SavedTab() {
    const forceUpdate = useForceUpdater();

    function remove(messageId: string) {
        saved = saved.filter(s => s.messageId !== messageId);
        persist();
        forceUpdate();
    }

    return (
        <div className={cl("root")}>
            <div className={cl("intro")}>
                Messages you've saved with the bookmark button. They stay here until you remove them.
            </div>
            {saved.length === 0
                ? <div className={cl("empty")}>Nothing saved yet. Hover a message and hit the bookmark to keep it here.</div>
                : saved.map(s => (
                    <div className={cl("row")} key={s.messageId}>
                        <div className={cl("body")}>
                            <div className={cl("author")}>{s.author}</div>
                            <div className={cl("content")}>{s.content}</div>
                            <div className={cl("meta")}>{new Date(s.savedAt).toLocaleString()}</div>
                        </div>
                        <div className={cl("actions")}>
                            <Button size={Button.Sizes.SMALL} onClick={() => jump(s)}>Jump</Button>
                            <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={() => remove(s.messageId)}>Remove</Button>
                        </div>
                    </div>
                ))}
        </div>
    );
}

export default definePlugin({
    name: "NyxcordSaved",
    description: "Save messages to a personal Nyxcord read-it-later list, with a bookmark button and a Saved tab.",
    authors: [EquicordDevs.Saxx],
    required: true,
    hidden: true,

    messagePopoverButton: {
        icon: BookmarkIcon,
        render(message: Message) {
            if (!message?.id) return null;
            return {
                label: "Save to Nyxcord",
                icon: BookmarkIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => saveMessage(message)
            };
        }
    },

    start() {
        SettingsPlugin.customEntries.push({
            key: "nyxcord_saved",
            title: "Saved",
            Component: SavedTab,
            Icon: BookmarkIcon
        });
    },

    stop() {
        removeFromArray(SettingsPlugin.customEntries, e => e.key === "nyxcord_saved");
    }
});
