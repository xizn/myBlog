# 不打包，直接以桌面窗口模式启动（开发/自用）
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run desktop
