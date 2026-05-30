/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface Persona {
    displayName: string;
    color: string;
}

export async function setProfile(apiUrl: string, token: string, displayName: string, color: string): Promise<Persona> {
    const res = await fetch(`${apiUrl}/api/profile`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, color })
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status}).`);
    }
    return res.json();
}

export async function getProfiles(apiUrl: string, ids: string[]): Promise<Record<string, Persona>> {
    if (!ids.length) return {};
    const res = await fetch(`${apiUrl}/api/profiles?ids=${ids.join(",")}`);
    if (!res.ok) return {};
    return res.json();
}
