# Starts Vite (frontend) and the server in two separate PowerShell windows.
# Usage: powershell -ExecutionPolicy Bypass -File .\run-dev.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Starting Vite in a new window (dev client)..."
Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -NoExit -Command Set-Location '$root'; npx vite" -WindowStyle Minimized

Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -NoExit -Command Set-Location '$root'; npx cross-env NODE_ENV=development tsx server/index.ts" -WindowStyle Minimized

Write-Host "Launched Vite and server in separate windows. Check those windows for logs."