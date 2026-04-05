$ErrorActionPreference = "Stop"

$pluginName = "sanka-plugin"
$pluginDestDir = Join-Path $HOME ".codex\plugins\$pluginName"
$marketplaceFile = Join-Path $HOME ".agents\plugins\marketplace.json"
$backupSuffix = Get-Date -Format "yyyyMMddHHmmss"

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

Write-Host "Removing Sanka Plugin from Codex..."
Write-Host ""

if (Test-Path $pluginDestDir) {
    Remove-Item -Path $pluginDestDir -Recurse -Force
    Write-Host "Removed plugin files from $pluginDestDir."
} else {
    Write-Host "Plugin files were already removed."
}

if (Test-Path $marketplaceFile) {
    Copy-Item -Path $marketplaceFile -Destination "$marketplaceFile.bak-$backupSuffix" -Force

    try {
        $marketplace = Get-Content -Path $marketplaceFile -Raw | ConvertFrom-Json
    } catch {
        throw "Existing marketplace.json is not valid JSON."
    }

    if (-not ($marketplace.PSObject.Properties.Name -contains "name") -or [string]::IsNullOrWhiteSpace([string]$marketplace.name)) {
        $marketplace | Add-Member -NotePropertyName name -NotePropertyValue "personal" -Force
    }

    if (-not ($marketplace.PSObject.Properties.Name -contains "interface") -or $null -eq $marketplace.interface) {
        $marketplace | Add-Member -NotePropertyName interface -NotePropertyValue ([pscustomobject]@{}) -Force
    }

    if (-not ($marketplace.interface.PSObject.Properties.Name -contains "displayName") -or [string]::IsNullOrWhiteSpace([string]$marketplace.interface.displayName)) {
        $marketplace.interface | Add-Member -NotePropertyName displayName -NotePropertyValue "Personal Plugins" -Force
    }

    $existingPlugins = @()
    if ($marketplace.PSObject.Properties.Name -contains "plugins" -and $null -ne $marketplace.plugins) {
        $existingPlugins = @($marketplace.plugins | Where-Object { $_ -and $_.name -ne "sanka-plugin" })
    }

    $marketplace | Add-Member -NotePropertyName plugins -NotePropertyValue $existingPlugins -Force

    $json = $marketplace | ConvertTo-Json -Depth 10
    Write-Utf8NoBom -Path $marketplaceFile -Content ($json + [Environment]::NewLine)
    Write-Host "Updated $marketplaceFile."
} else {
    Write-Host "No marketplace.json found. Nothing to update."
}

Write-Host ""
Write-Host "Uninstall complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Restart Codex."
Write-Host "2. Confirm 'Sanka Plugin' no longer appears under 'Personal Plugins'."
