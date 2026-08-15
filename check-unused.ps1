Write-Host "Checking project for unused dependencies..." -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Run this script from project root." -ForegroundColor Red
    exit 1
}

$json = npx --yes depcheck --json 2>$null

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($json)) {
    Write-Host "Error: depcheck could not run. Check your npm/network connection." -ForegroundColor Red
    exit 1
}

$result = $json | ConvertFrom-Json

Write-Host "`nUnused dependencies:" -ForegroundColor Yellow
if ($result.dependencies.Count -gt 0) {
    $result.dependencies | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host " None"
}

Write-Host "`nUnused devDependencies:" -ForegroundColor Yellow
if ($result.devDependencies.Count -gt 0) {
    $result.devDependencies | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host " None"
}

Write-Host "`nMissing dependencies:" -ForegroundColor Yellow
if ($result.missing.PSObject.Properties.Count -gt 0) {
    $result.missing.PSObject.Properties | ForEach-Object {
        Write-Host " - $($_.Name)"
    }
} else {
    Write-Host " None"
}
