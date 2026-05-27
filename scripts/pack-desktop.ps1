# Build Windows desktop app: portable exe or NSIS Setup installer
param(
    [string]$InstallDir = "",
    [switch]$NoCopy,
    [switch]$Setup
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $InstallDir) {
    $InstallDir = $env:STUDIO_BLOG_INSTALL_DIR
}
if (-not $InstallDir -and -not $NoCopy) {
    $InstallDir = [Environment]::GetFolderPath("Desktop")
}

Write-Host ">> Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($Setup) {
    Write-Host ">> Packaging NSIS Setup installer (first run may download Electron)..." -ForegroundColor Cyan
    npm run pack:win:setup
} else {
    Write-Host ">> Packaging portable exe (first run may download Electron)..." -ForegroundColor Cyan
    npm run pack:win
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$releaseDir = Join-Path $Root "release"
$filter = if ($Setup) { "*Setup*.exe" } else { "*.exe" }
$exe = Get-ChildItem -Path $releaseDir -Filter $filter |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $exe) {
    Write-Host "No matching exe in: $releaseDir (filter: $filter)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Output: $($exe.FullName)" -ForegroundColor Gray

if ($NoCopy) {
    Write-Host "Skipped copy (-NoCopy)." -ForegroundColor Yellow
    exit 0
}

if (-not (Test-Path -LiteralPath $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$dest = Join-Path $InstallDir $exe.Name
Copy-Item -Path $exe.FullName -Destination $dest -Force

Write-Host ""
Write-Host "Done. Copied to:" -ForegroundColor Green
Write-Host $dest
Write-Host ""
if ($Setup) {
    Write-Host "Setup installer: double-click to install (Start menu + optional desktop shortcut)." -ForegroundColor Gray
    Write-Host "Uninstall via Windows Settings -> Apps -> Studio Blog." -ForegroundColor Gray
} else {
    Write-Host "Portable exe: run from any folder, no installer needed." -ForegroundColor Gray
}
