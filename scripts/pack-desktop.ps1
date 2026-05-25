# Build Windows portable exe; optionally copy to InstallDir (default: Desktop)
param(
    [string]$InstallDir = "",
    [switch]$NoCopy
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

Write-Host ">> Packaging desktop app (first run may download Electron)..." -ForegroundColor Cyan
npm run pack:win
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$releaseDir = Join-Path $Root "release"
$exe = Get-ChildItem -Path $releaseDir -Filter "*.exe" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $exe) {
    Write-Host "No .exe found in: $releaseDir" -ForegroundColor Red
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
Write-Host "Portable exe: run from any folder, no installer needed." -ForegroundColor Gray
