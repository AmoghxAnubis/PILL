$ErrorActionPreference = 'Stop'

$repoRoot = (
    Resolve-Path (
        Join-Path $PSScriptRoot '..\..'
    )
).Path

$controlRoot = Join-Path `
    $repoRoot `
    'pill-control'

$controlBinary = Join-Path `
    $controlRoot `
    'src-tauri\target\release\PILL-Control.exe'

Write-Host 'Building PILL Control...'

Push-Location $controlRoot

try {
    & npx tauri build --no-bundle

    if ($LASTEXITCODE -ne 0) {
        throw 'PILL Control release build failed.'
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path $controlBinary)) {
    throw (
        "PILL Control binary was not produced: " +
        $controlBinary
    )
}

Write-Host "PILL Control ready: $controlBinary"

Write-Host 'Building PILL frontend...'

Push-Location (
    Join-Path $repoRoot 'archipelago'
)

try {
    & npm run build

    if ($LASTEXITCODE -ne 0) {
        throw 'PILL frontend build failed.'
    }
}
finally {
    Pop-Location
}

Write-Host 'PILL release preparation complete.'