/*
 * Nyxcord injector. Patches Discord to load this build, with no third-party
 * installer. The patch itself is tiny: back up Discord's app.asar to _app.asar,
 * then write a stub app.asar that loads dist/desktop (which loads the original).
 *
 * Usage: node scripts/nyxcordInject.mjs            (install)
 *        node scripts/nyxcordInject.mjs --uninstall
 */

import { existsSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const asar = createRequire(import.meta.url)("@electron/asar");

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(REPO, "dist", "desktop");

const CANDIDATES = [
    "/Applications/Discord.app/Contents/Resources",
    "/Applications/Discord PTB.app/Contents/Resources",
    "/Applications/Discord Canary.app/Contents/Resources",
    "/usr/lib/discord/resources",
    "/opt/discord/resources",
    "/opt/Discord/resources",
    join(process.env.HOME ?? "", ".local/share/Discord/resources")
];

function findResources() {
    for (const dir of CANDIDATES) {
        if (existsSync(join(dir, "app.asar")) || existsSync(join(dir, "_app.asar"))) return dir;
    }
    return null;
}

async function packStub(appAsar) {
    const tmp = mkdtempSync(join(tmpdir(), "nyxcord-stub-"));
    writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "discord", main: "index.js" }));
    writeFileSync(join(tmp, "index.js"), `require(${JSON.stringify(DIST)});\n`);
    await asar.createPackage(tmp, appAsar);
    rmSync(tmp, { recursive: true, force: true });
}

const uninstall = process.argv.includes("--uninstall");
const res = findResources();

if (!res) {
    console.error("Could not find Discord. Make sure the desktop app is installed.");
    process.exit(1);
}

const appAsar = join(res, "app.asar");
const backup = join(res, "_app.asar");

if (uninstall) {
    if (existsSync(backup)) {
        rmSync(appAsar, { force: true });
        renameSync(backup, appAsar);
        console.log("Nyxcord removed from Discord. Restart Discord.");
    } else {
        console.log("Nyxcord doesn't appear to be installed.");
    }
} else {
    if (!existsSync(backup)) {
        if (!existsSync(appAsar)) {
            console.error("Discord's app.asar is missing. Try reinstalling Discord.");
            process.exit(1);
        }
        renameSync(appAsar, backup); // keep the original
    } else {
        rmSync(appAsar, { force: true }); // already backed up; drop the old stub
    }
    await packStub(appAsar);
    console.log(`Nyxcord injected into Discord at ${res}.`);
    console.log("Restart Discord to load it.");
}
