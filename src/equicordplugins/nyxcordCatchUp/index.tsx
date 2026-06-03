/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { makeRange, OptionType, PluginNative } from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { MessageStore, ReadStateStore } from "@webpack/common";

const Native = VencordNative.pluginHelpers.NyxcordCatchUp as PluginNative<typeof import("./native")>;

const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "AI provider to use.",
        options: [
            { label: "Anthropic (Claude)", value: "anthropic", default: true },
            { label: "OpenAI", value: "openai" }
        ]
    },
    apiKey: {
        type: OptionType.STRING,
        description: "Your API key for the chosen provider. Stored locally and sent only to that provider.",
        default: ""
    },
    model: {
        type: OptionType.STRING,
        description: "Model id. Leave blank for a cheap default (Claude Haiku or gpt-4o-mini).",
        default: ""
    },
    messageCount: {
        type: OptionType.SLIDER,
        description: "Most unread messages to read when catching up. Older ones beyond this are skipped.",
        markers: makeRange(20, 200, 20),
        default: 60,
        stickToMarkers: true
    }
});

function formatTranscript(messages: Message[]): string {
    const lines: string[] = [];
    for (const m of messages) {
        const author = m?.author?.username;
        const content = m?.content?.trim();
        if (author && content) lines.push(`${author}: ${content}`);
    }
    return lines.join("\n");
}

export default definePlugin({
    name: "NyxcordCatchUp",
    description: "Summarize what you missed in a channel with AI. Bring your own API key (Anthropic or OpenAI), so it stays free.",
    authors: [EquicordDevs.Saxx],
    settings,

    commands: [
        {
            name: "catchup",
            description: "Summarize what you missed in this channel since you last read it.",
            options: [
                {
                    name: "count",
                    description: "Summarize the last N messages instead of just the unread ones.",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: false
                }
            ],
            execute: async (args, ctx) => {
                const channelId = ctx.channel.id;
                const explicitCount = findOption<number>(args, "count");
                const all: Message[] = MessageStore.getMessages(channelId)?._array ?? [];

                let slice: Message[];
                let truncated = false;
                if (explicitCount === undefined) {
                    const oldestUnread = ReadStateStore.getOldestUnreadMessageId(channelId);
                    const start = oldestUnread ? all.findIndex(m => m?.id === oldestUnread) : -1;
                    if (start < 0) {
                        sendBotMessage(channelId, { content: "You're all caught up here, nothing new to summarize." });
                        return;
                    }
                    const cap = settings.store.messageCount;
                    const unread = all.slice(start);
                    truncated = unread.length > cap;
                    slice = unread.slice(-cap);
                } else {
                    slice = all.slice(-explicitCount);
                }

                const transcript = formatTranscript(slice);
                if (!transcript) {
                    sendBotMessage(channelId, { content: "There's nothing recent to catch up on here." });
                    return;
                }

                sendBotMessage(channelId, {
                    content: truncated
                        ? `Catching you up on the most recent ${settings.store.messageCount} unread messages…`
                        : "Catching you up…"
                });

                const prompt =
                    "You are catching someone up on a Discord channel they haven't read. " +
                    "Summarize the conversation below into a few concise bullet points: the main topics, " +
                    "any decisions or open questions, and anything that seems directed at the reader. Keep it short.\n\n" +
                    transcript;

                const res = await Native.summarize({
                    provider: settings.store.provider,
                    apiKey: settings.store.apiKey,
                    model: settings.store.model,
                    prompt
                });

                sendBotMessage(channelId, {
                    content: res.ok ? (res.text || "No summary came back.") : `Catch up failed: ${res.error}`
                });
            }
        }
    ]
});
