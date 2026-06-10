# deploy.ps1 — Deploy contracts and save Anvil state
# Run this ONCE after reset.ps1 (while Anvil is running with --no-mining or normally)
# Usage: .\scripts\deploy.ps1

Write-Host "`n🚀 Deploying Contracts..." -ForegroundColor Cyan

# Deploy to Anvil
Set-Location blockchain
$output = forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545 2>&1
Write-Host $output

# Extract addresses from output
$lines = $output -split "`n"
$rm  = ($lines | Where-Object { $_ -match "RoleManager deployed" }      | Select-Object -First 1) -replace ".*: ", ""
$pb  = ($lines | Where-Object { $_ -match "ProductBatch deployed" }     | Select-Object -First 1) -replace ".*: ", ""
$ccm = ($lines | Where-Object { $_ -match "ColdChainMonitor deployed" } | Select-Object -First 1) -replace ".*: ", ""

Set-Location ..

if ($rm -and $pb -and $ccm) {
    Write-Host "`n✅ Contracts deployed!" -ForegroundColor Green
    Write-Host "  RoleManager:      $rm"
    Write-Host "  ProductBatch:     $pb"
    Write-Host "  ColdChainMonitor: $ccm"

    # Update backend/.env
    (Get-Content backend/.env) `
        -replace "ROLE_MANAGER_ADDRESS=.*",       "ROLE_MANAGER_ADDRESS=$rm" `
        -replace "PRODUCT_BATCH_ADDRESS=.*",      "PRODUCT_BATCH_ADDRESS=$pb" `
        -replace "COLD_CHAIN_MONITOR_ADDRESS=.*", "COLD_CHAIN_MONITOR_ADDRESS=$ccm" |
        Set-Content backend/.env

    # Update client/.env
    (Get-Content client/.env) `
        -replace "VITE_ROLE_MANAGER_ADDRESS=.*",       "VITE_ROLE_MANAGER_ADDRESS=$rm" `
        -replace "VITE_PRODUCT_BATCH_ADDRESS=.*",      "VITE_PRODUCT_BATCH_ADDRESS=$pb" `
        -replace "VITE_COLD_CHAIN_MONITOR_ADDRESS=.*", "VITE_COLD_CHAIN_MONITOR_ADDRESS=$ccm" |
        Set-Content client/.env

    Write-Host "`n✅ .env files updated automatically!" -ForegroundColor Green

    # Save Anvil state so we never need to redeploy
    Write-Host "`nSaving Anvil state..." -ForegroundColor Yellow
    Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8545" `
        -ContentType "application/json" `
        -Body '{"jsonrpc":"2.0","method":"anvil_dumpState","params":[],"id":1}' | Out-Null
    Write-Host "✅ State saved!"

    Write-Host "`n🎉 Setup complete! Now run backend and client:" -ForegroundColor Green
    Write-Host "   cd backend && npm run dev"
    Write-Host "   cd client  && npm run dev"
} else {
    Write-Host "`n Could not extract contract addresses. Check forge output above." -ForegroundColor Red
}
