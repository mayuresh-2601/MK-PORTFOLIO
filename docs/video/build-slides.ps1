# Render one 1280x720 slide PNG per script section.
# Each slide: acid-green background, screenshot on the right, big brutalist title on the left.
param([string]$ManifestFile = "manifest.json", [string]$OutDir = "slides")

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $root $ManifestFile
$outPath = Join-Path $root $OutDir
$shotDir = Join-Path (Split-Path -Parent $root) "screenshots"

if (-not (Test-Path $outPath)) { New-Item -ItemType Directory -Path $outPath | Out-Null }

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

$W = 1280; $H = 720
$acid = [System.Drawing.Color]::FromArgb(204, 255, 0)
$ink  = [System.Drawing.Color]::FromArgb(17, 17, 17)
$pink = [System.Drawing.Color]::FromArgb(255, 51, 204)
$white = [System.Drawing.Color]::White

function Get-Font($family, $size, $bold) {
    $style = [System.Drawing.FontStyle]::Regular
    if ($bold) { $style = [System.Drawing.FontStyle]::Bold }
    return New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

foreach ($item in $manifest) {
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($acid)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Grid lines (subtle, matches the site background grid)
    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(20, 17, 17, 17), 1)
    for ($x = 0; $x -lt $W; $x += 80) { $g.DrawLine($gridPen, $x, 0, $x, $H) }
    for ($y = 0; $y -lt $H; $y += 80) { $g.DrawLine($gridPen, 0, $y, $W, $y) }

    # Pink top bar
    $g.FillRectangle([System.Drawing.Brushes]::Pink, 0, 0, $W, 8)

    # Left panel: chapter label + heading + subheading
    $fontMeta  = Get-Font "Space Mono" 16 $true
    $fontTitle = Get-Font "Inter" 52 $true
    $fontSub   = Get-Font "Inter" 20 $false

    $g.DrawString($item.chapter.ToUpper(), $fontMeta, [System.Drawing.Brushes]::Black, 56, 48)
    $g.DrawString($item.heading, $fontTitle, [System.Drawing.Brushes]::Black, 56, 90, (New-Object System.Drawing.StringFormat([System.Drawing.StringFormatFlags]::NoWrap)))

    # Wrap subheading manually
    $lines = @(); $current = ""
    foreach ($word in ($item.subheading -split ' ')) {
        $test = if ($current) { "$current $word" } else { $word }
        if ($test.Length -gt 34 -and $current) { $lines += $current; $current = $word } else { $current = $test }
    }
    if ($current) { $lines += $current }
    $ySub = 300
    foreach ($ln in $lines) {
        $g.DrawString($ln, $fontSub, [System.Drawing.Brushes]::Black, 58, $ySub)
        $ySub += 30
    }

    # Accent bar under subheading
    $g.FillRectangle([System.Drawing.Brushes]::Black, 56, $ySub + 10, 360, 4)

    # Footer brand
    $g.DrawString("MAYURESH.DEV", (Get-Font "Space Mono" 14 $true), [System.Drawing.Brushes]::Black, 56, 660)

    # Right side: screenshot inside a hard-bordered frame
    $shotPath = Join-Path $shotDir $item.slide
    if (Test-Path $shotPath) {
        $img = [System.Drawing.Image]::FromFile($shotPath)
        $frameX = 600; $frameY = 48; $frameW = 624; $frameH = 576
        # Scale to fit while preserving aspect ratio
        $ratio = [math]::Min($frameW / $img.Width, $frameH / $img.Height)
        $dw = [int]($img.Width * $ratio); $dh = [int]($img.Height * $ratio)
        $dx = $frameX + [int](($frameW - $dw) / 2)
        $dy = $frameY + [int](($frameH - $dh) / 2)
        $g.DrawImage($img, $dx, $dy, $dw, $dh)
        $g.DrawRectangle((New-Object System.Drawing.Pen($ink, 4)), $frameX, $frameY, $frameW, $frameH)
        # Offset shadow
        $g.DrawRectangle((New-Object System.Drawing.Pen($pink, 4)), $frameX + 8, $frameY + 8, $frameW, $frameH)
        $img.Dispose()
    }

    $out = Join-Path $outPath "$($item.id).png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "Rendered $($item.id).png"
}

Write-Output "Slides: $outPath"
