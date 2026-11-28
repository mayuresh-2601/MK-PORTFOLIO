# Build a 1280x720 YouTube thumbnail from the home screenshot.
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$shot = Join-Path (Split-Path -Parent $root) "screenshots\home.png"
$out  = Join-Path $root "thumbnail.png"

$bmp = New-Object System.Drawing.Bitmap(1280, 720)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$acid = [System.Drawing.Color]::FromArgb(204,255,0)
$ink  = [System.Drawing.Color]::FromArgb(17,17,17)
$pink = [System.Drawing.Color]::FromArgb(255,51,204)

# Background: home screenshot darkened
$img = [System.Drawing.Image]::FromFile($shot)
$g.DrawImage($img, 0, 0, 1280, 720)
$img.Dispose()
$overlay = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150,17,17,17))
$g.FillRectangle($overlay, 0, 0, 1280, 720)

# Left text block on acid panel
$g.FillRectangle((New-Object System.Drawing.SolidBrush($acid)), 60, 180, 720, 340)

$f1 = New-Object System.Drawing.Font("Inter", 72, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$f2 = New-Object System.Drawing.Font("Inter", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$f3 = New-Object System.Drawing.Font("Space Mono", 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$g.DrawString("FULL STACK", $f1, [System.Drawing.Brushes]::Black, 90, 215)
$g.DrawString("PORTFOLIO", $f1, [System.Drawing.Brushes]::Black, 90, 295)
$g.DrawString("10-MINUTE TOUR", $f2, [System.Drawing.Brushes]::Black, 92, 405)

# Pink badge
$g.FillRectangle((New-Object System.Drawing.SolidBrush($pink)), 90, 465, 300, 36)
$g.DrawString("MAYURESH.DEV", $f3, [System.Drawing.Brushes]::White, 100, 468)

# Hard borders
$g.DrawRectangle((New-Object System.Drawing.Pen($ink, 6)), 60, 180, 720, 340)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "Thumbnail: $out"
