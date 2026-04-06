$ErrorActionPreference = "Stop"

$pluginName = "sanka-plugin"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$packagedPayloadDir = Join-Path $scriptDir "Support\payload"
$pluginSourceDir = if (Test-Path $packagedPayloadDir) { $packagedPayloadDir } else { $scriptDir }
$pluginDestDir = Join-Path $HOME ".codex\plugins\$pluginName"
$marketplaceDir = Join-Path $HOME ".agents\plugins"
$marketplaceFile = Join-Path $marketplaceDir "marketplace.json"
$backupSuffix = Get-Date -Format "yyyyMMddHHmmss"
$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("sanka-plugin-" + [System.Guid]::NewGuid().ToString("N"))

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

Write-Host "Installing Sanka Plugin for Codex..."
Write-Host ""

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pluginDestDir) | Out-Null
New-Item -ItemType Directory -Force -Path $marketplaceDir | Out-Null
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

try {
    $stagingDir = Join-Path $tmpDir $pluginName
    New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

    Copy-Item -Path (Join-Path $pluginSourceDir "*") -Destination $stagingDir -Recurse -Force

    $gitDir = Join-Path $stagingDir ".git"
    if (Test-Path $gitDir) {
        Remove-Item -Path $gitDir -Recurse -Force
    }

    $distDir = Join-Path $stagingDir "dist"
    if (Test-Path $distDir) {
        Remove-Item -Path $distDir -Recurse -Force
    }

    if (Test-Path $pluginDestDir) {
        Remove-Item -Path $pluginDestDir -Recurse -Force
    }

    Move-Item -Path $stagingDir -Destination $pluginDestDir

    if (Test-Path $marketplaceFile) {
        Copy-Item -Path $marketplaceFile -Destination "$marketplaceFile.bak-$backupSuffix" -Force

        try {
            $marketplace = Get-Content -Path $marketplaceFile -Raw | ConvertFrom-Json
        } catch {
            throw "Existing marketplace.json is not valid JSON."
        }
    } else {
        $marketplace = [pscustomobject]@{
            name = "personal"
            interface = [pscustomobject]@{
                displayName = "Personal Plugins"
            }
            plugins = @()
        }
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
        $existingPlugins = @($marketplace.plugins | Where-Object { $_.name -ne "sanka-plugin" })
    }

    $entry = [pscustomobject]@{
        name = "sanka-plugin"
        source = [pscustomobject]@{
            source = "local"
            path = "./.codex/plugins/sanka-plugin"
        }
        policy = [pscustomobject]@{
            installation = "AVAILABLE"
            authentication = "ON_USE"
        }
        category = "Productivity"
    }

    $marketplace | Add-Member -NotePropertyName plugins -NotePropertyValue (@($existingPlugins) + $entry) -Force

    $json = $marketplace | ConvertTo-Json -Depth 10
    Write-Utf8NoBom -Path $marketplaceFile -Content ($json + [Environment]::NewLine)
} finally {
    if (Test-Path $tmpDir) {
        Remove-Item -Path $tmpDir -Recurse -Force
    }
}

Write-Host "Installation complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Restart Codex."
Write-Host "2. Open Plugins and choose 'Personal Plugins'."
Write-Host "3. Install 'Sanka Plugin'."
Write-Host "4. Sign in to Sanka when prompted."
