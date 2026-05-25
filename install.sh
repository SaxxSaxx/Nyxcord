#!/usr/bin/env bash
set -euo pipefail

CLIENT_NAME="Nyxcord"
REPO_URL="https://github.com/SaxxSaxx/Nyxcord"
INSTALL_DIR="$HOME/.nyxcord"

command -v git  >/dev/null || { echo "git is required.  Install from https://git-scm.com/"; exit 1; }
command -v node >/dev/null || { echo "node (LTS) is required.  Install from https://nodejs.org/"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm is required.  Run: npm install -g pnpm"; exit 1; }

if [[ -d "$INSTALL_DIR" ]]; then
    echo "Updating existing $CLIENT_NAME at $INSTALL_DIR"
    cd "$INSTALL_DIR"
    git pull --ff-only
else
    echo "Cloning $CLIENT_NAME into $INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

pnpm install
pnpm build
pnpm inject

echo ""
echo "$CLIENT_NAME installed.  Restart Discord to load it."
echo "To uninstall later: cd $INSTALL_DIR && pnpm uninject"
