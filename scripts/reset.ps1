# reset.ps1 — Full fresh reset for Cold Chain System
# Run this ONLY when you want to start from scratch
# Usage: .\scripts\reset.ps1

Write-Host "`n🧊 ColdChain System — Full Reset" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Clear MongoDB
Write-Host "`n[1/4] Clearing MongoDB..." -ForegroundColor Yellow
mongosh coldchain --eval "db.products.deleteMany({}); db.transferhistories.deleteMany({}); db.monitoringlogs.deleteMany({}); db.stakeholders.deleteMany({}); print('✅ MongoDB cleared');"

# 2. Delete old Anvil state file
Write-Host "`n[2/4] Removing old Anvil state..." -ForegroundColor Yellow
if (Test-Path "anvil-state.json") { Remove-Item "anvil-state.json" }
Write-Host "✅ State file removed"

# 3. Build contracts
Write-Host "`n[3/4] Building contracts..." -ForegroundColor Yellow
Set-Location blockchain
forge build
Set-Location ..
Write-Host "✅ Contracts built"

Write-Host "`n[4/4] Done! Now run: .\scripts\start.ps1" -ForegroundColor Green
Write-Host "NOTE: Anvil must be running BEFORE you run start.ps1" -ForegroundColor DarkYellow
