/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const ENDPOINTS = {
    anthropic: "https://api.anthropic.com/v1/messages",
    openai: "https://api.openai.com/v1/chat/completions"
} as const;

interface SummarizeArgs {
    provider: string;
    apiKey: string;
    model: string;
    prompt: string;
}

type Result = { ok: true; text: string; } | { ok: false; error: string; };

export async function summarize(_, args: SummarizeArgs): Promise<Result> {
    const { provider, apiKey, model, prompt } = args ?? ({} as SummarizeArgs);

    if (typeof apiKey !== "string" || !apiKey.trim())
        return { ok: false, error: "Add your API key in the NyxcordCatchUp settings." };
    if (typeof prompt !== "string" || !prompt.trim())
        return { ok: false, error: "Nothing to summarize." };

    try {
        if (provider === "openai") {
            const res = await fetch(ENDPOINTS.openai, {
                method: "POST",
                headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model || "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data?.error?.message || `Request failed (${res.status}).` };
            return { ok: true, text: data?.choices?.[0]?.message?.content ?? "" };
        }

        // Default provider: Anthropic.
        const res = await fetch(ENDPOINTS.anthropic, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: model || "claude-haiku-4-5-20251001",
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data?.error?.message || `Request failed (${res.status}).` };
        return { ok: true, text: data?.content?.[0]?.text ?? "" };
    } catch {
        return { ok: false, error: "Could not reach the AI provider." };
    }
}
