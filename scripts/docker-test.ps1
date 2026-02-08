$ErrorActionPreference = 'Stop'

Write-Host "=== Installing npm dependencies ===" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Running frontend tests (Vitest) ===" -ForegroundColor Cyan
npx vitest run
$vitestExit = $LASTEXITCODE

Write-Host "`n=== Running Rust tests (cargo test) ===" -ForegroundColor Cyan
Push-Location src-tauri
cargo test 2>&1
$cargoExit = $LASTEXITCODE
Pop-Location

Write-Host "`n========================================" -ForegroundColor White
if ($vitestExit -eq 0 -and $cargoExit -eq 0) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor White
    exit 0
} else {
    if ($vitestExit -ne 0) { Write-Host "  Vitest:     FAILED" -ForegroundColor Red }
    else { Write-Host "  Vitest:     PASSED" -ForegroundColor Green }
    if ($cargoExit -ne 0) { Write-Host "  Cargo test: FAILED" -ForegroundColor Red }
    else { Write-Host "  Cargo test: PASSED" -ForegroundColor Green }
    Write-Host "========================================" -ForegroundColor White
    exit 1
}
