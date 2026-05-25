# install.ps1 - Nyxcord installer for Windows
$ErrorActionPreference = "Stop"

$ClientName = "Nyxcord"
$RepoUrl    = "https://github.com/SaxxSaxx/Nyxcord"
$InstallDir = Join-Path $env:USERPROFILE ".nyxcord"

foreach ($cmd in @("git","node","pnpm")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        switch ($cmd) {
            "git"  { Write-Error "git is required. Install from https://git-scm.com/" }
            "node" { Write-Error "node (LTS) is required. Install from https://nodejs.org/" }
            "pnpm" { Write-Error "pnpm is required. Run: npm install -g pnpm" }
        }
        exit 1
    }
}

if (Test-Path $InstallDir) {
    Write-Host "Updating existing $ClientName at $InstallDir"
    Push-Location $InstallDir
    git pull --ff-only
} else {
    Write-Host "Cloning $ClientName into $InstallDir"
    git clone $RepoUrl $InstallDir
    Push-Location $InstallDir
}

pnpm install
pnpm build
pnpm inject
Pop-Location

Write-Host ""
Write-Host "$ClientName installed. Restart Discord to load it."
Write-Host "To uninstall later: cd $InstallDir; pnpm uninject"
