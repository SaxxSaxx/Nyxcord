/*
 * Generates the Nyx Glass theme family from misc/themes/glass.template.css.
 * Usage: node scripts/generateGlassThemes.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const THEMES = join(REPO, "misc", "themes");

// Baked mood values mirror the flat moods; glow amplified for the glass look.
const MOODS = [
    { file: "nyx-glass", name: "Nyx · Glass", bgH: 258, bgS: 30, accentH: 270, glow: 0.7, stars: 1 },
    { file: "nyx-glass-aurora", name: "Aurora · Glass", bgH: 205, bgS: 32, accentH: 160, glow: 0.7, stars: 1 },
    { file: "nyx-glass-eclipse", name: "Eclipse · Glass", bgH: 245, bgS: 16, accentH: 250, glow: 0.35, stars: 0 },
    { file: "nyx-glass-nebula", name: "Nebula · Glass", bgH: 268, bgS: 34, accentH: 305, glow: 0.8, stars: 1 },
    { file: "nyx-glass-midnight", name: "Midnight · Glass", bgH: 222, bgS: 38, accentH: 222, glow: 0.6, stars: 1 },
    { file: "nyx-glass-rose", name: "Rose · Glass", bgH: 320, bgS: 26, accentH: 335, glow: 0.65, stars: 1 },
    { file: "nyx-glass-ember", name: "Ember · Glass", bgH: 20, bgS: 24, accentH: 25, glow: 0.6, stars: 0 },
    { file: "nyx-glass-mono", name: "Mono · Glass", bgH: 240, bgS: 6, accentH: 250, glow: 0.25, stars: 0 }
];

const template = readFileSync(join(THEMES, "glass.template.css"), "utf8");

for (const m of MOODS) {
    const css = template
        .replaceAll("__NAME__", m.name)
        .replaceAll("__BG_H__", String(m.bgH))
        .replaceAll("__BG_S__", String(m.bgS))
        .replaceAll("__ACCENT_H__", String(m.accentH))
        .replaceAll("__GLOW__", String(m.glow))
        .replaceAll("__STARS__", String(m.stars));
    writeFileSync(join(THEMES, `${m.file}.theme.css`), css);
    console.log(`wrote ${m.file}.theme.css`);
}
