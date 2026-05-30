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
import { MessageStore } from "@webpack/common";

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
        description: "How many recent messages to read when catching up.",
        markers: makeRange(20, 200, 20),
        default: 60,
        stickToMarkers: true
    }
});

function buildTranscript(channelId: string, count: number): string {
    const messages: Message[] = MessageStore.getMessages(channelId)?._array ?? [];
    const lines: string[] = [];
    for (const m of messages.slice(-count)) {
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
            description: "Summarize the recent messages in this channel.",
            options: [
                {
                    name: "count",
                    description: "How many recent messages to read (optional).",
                    type: ApplicationCommandOptionType.INTEGER,
                    required: false
                }
            ],
            execute: async (args, ctx) => {
                const channelId = ctx.channel.id;
                const count = findOption(args, "count", settings.store.messageCount);
                const transcript = buildTranscript(channelId, count);

                if (!transcript) {
                    sendBotMessage(channelId, { content: "There's nothing recent to catch up on here." });
                    return;
                }

                sendBotMessage(channelId, { content: "Catching you up…" });

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
