param(
  [int]$RobustnessWorlds = 3,
  [string]$BaseDir = "analysis/scenario4-report-study",
  [switch]$SkipFullPaths
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$root = Join-Path $BaseDir $stamp
$structural = Join-Path $root "structural-world1"
$robustness = Join-Path $root ("robustness-worlds{0}" -f $RobustnessWorlds)
$analysis = Join-Path $root "report-analysis"

New-Item -ItemType Directory -Force -Path $root | Out-Null

Write-Host "=== Scenario 4 report study ==="
Write-Host "Root: $root"
Write-Host ""

if (-not $SkipFullPaths) {
  Write-Host "[1/3] Full structural exhaustive run (world=1, writes all-paths.csv.gz)..."
  npx tsx .\scripts\exhaustive-s4-outcomes.ts --worlds 1 --out-dir $structural
  if ($LASTEXITCODE -ne 0) { throw "Structural exhaustive run failed." }
} else {
  Write-Host "[1/3] Skipped full-path structural run."
  Write-Host "You must provide/copy a structural summary before analysis."
}

Write-Host ""
Write-Host "[2/3] Robustness exhaustive run ($RobustnessWorlds worlds, summary only)..."
  npx tsx .\scripts\exhaustive-s4-outcomes.ts --worlds $RobustnessWorlds --summary-only --out-dir $robustness
if ($LASTEXITCODE -ne 0) { throw "Robustness run failed." }

Write-Host ""
Write-Host "[3/3] Building report-ready tables..."

$structuralSummary = Join-Path $structural "summary.json"
$robustnessSummary = Join-Path $robustness "summary.json"
$paths = Join-Path $structural "all-paths.csv.gz"

if ($SkipFullPaths) {
  Write-Host "SkipFullPaths was used, so automatic analysis cannot locate a new structural summary."
  Write-Host "Run analyze-s4-report.ts manually against an existing structural summary."
  exit 0
}

npx tsx .\scripts\analyze-s4-report.ts `
  --structural-summary $structuralSummary `
  --robustness-summary $robustnessSummary `
  --paths $paths `
  --out-dir $analysis

if ($LASTEXITCODE -ne 0) { throw "Report analyzer failed." }

Write-Host ""
Write-Host "Done."
Write-Host "Structural: $structural"
Write-Host "Robustness: $robustness"
Write-Host "Report tables: $analysis"
