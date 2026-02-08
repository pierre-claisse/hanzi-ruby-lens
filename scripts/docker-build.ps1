$ErrorActionPreference = 'Stop'

Write-Host "=== Installing dependencies ===" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Building Tauri application ===" -ForegroundColor Cyan
npx tauri build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Copy output to host-accessible directory
$outputDir = "C:/app/output"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

# Copy NSIS installer if present
$nsisDir = "src-tauri/target/release/bundle/nsis"
if (Test-Path $nsisDir) {
    Copy-Item "$nsisDir/*.exe" $outputDir -Force
    Write-Host "`nNSIS installer copied" -ForegroundColor Green
}

# Copy raw executable
$rawExe = "src-tauri/target/release/hanzi-ruby-lens.exe"
if (Test-Path $rawExe) {
    Copy-Item $rawExe $outputDir -Force
    Write-Host "Raw executable copied" -ForegroundColor Green
}

Write-Host "`n=== Build complete ===" -ForegroundColor Green
Write-Host "Output directory: output/"
Get-ChildItem $outputDir | ForEach-Object {
    Write-Host "  $($_.Name) ($([math]::Round($_.Length/1MB, 1)) MB)"
}
