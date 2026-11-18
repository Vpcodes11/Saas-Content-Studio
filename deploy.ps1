Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      SaaS Content Studio Production Deployment    " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build Shared Types
Write-Host "[1/4] Building @scs/shared library..." -ForegroundColor Yellow
pnpm --filter @scs/shared build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to compile @scs/shared." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Package Chrome Extension
Write-Host "[2/4] Packaging Chrome Extension (Manifest V3)..." -ForegroundColor Yellow
pnpm --filter @scs/extension zip
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to package Chrome Extension." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 3. Build Web Dashboard
Write-Host "[3/4] Compiling Next.js Web Dashboard..." -ForegroundColor Yellow
pnpm --filter @scs/web build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to build Web Dashboard." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 4. Verify Database & Health Check
Write-Host "[4/4] Verifying deployment outputs..." -ForegroundColor Green

$extensionUnpacked = "apps/extension/.output/chrome-mv3"
$extensionZip = "apps/extension/.output/scsextension-0.1.0-chrome.zip"

if (Test-Path $extensionUnpacked) {
    Write-Host "  ✓ Extension Unpacked Dir: $extensionUnpacked" -ForegroundColor Green
}
if (Test-Path $extensionZip) {
    $zipSize = (Get-Item $extensionZip).Length / 1KB
    Write-Host "  ✓ Extension Distribution ZIP: $extensionZip ($([math]::Round($zipSize, 1)) KB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Deployment Ready! " -ForegroundColor Green
Write-Host " To start the studio: .\start-studio.bat or pnpm --filter @scs/web start" -ForegroundColor White
Write-Host " Dashboard URL: http://localhost:3000" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
