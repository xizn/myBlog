# 从 indexdoc-editor-main 同步 Cherry Markdown 静态资源到 public/vendor
# 用法: powershell -ExecutionPolicy Bypass -File scripts/sync-cherry-from-indexdoc.ps1

$src = "D:\study_file\github学习\markdown编辑器\indexdoc-editor-main\html\pc\public\static\cherry-markdown"
$dst = Join-Path $PSScriptRoot "..\public\vendor\cherry-markdown"

if (-not (Test-Path $src)) {
  Write-Error "源目录不存在: $src"
  exit 1
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
Write-Host "OK: 已同步到 $dst"
