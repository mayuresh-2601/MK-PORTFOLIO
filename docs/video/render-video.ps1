# Render the final YouTube-ready MP4 from slides + one concatenated narration track.
$ErrorActionPreference = "Continue"
# Prevent PowerShell from treating native command stderr (ffmpeg stats) as errors.
$PSNativeCommandUseErrorActionPreference = $false
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$manifest = Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
$slides  = Join-Path $root "slides"
$narr    = Join-Path $root "narration"
$concat  = Join-Path $root "slides.txt"
$audioList = Join-Path $root "audio.txt"
$mergedAudio = Join-Path $root "narration-full.wav"
$outPath = Join-Path $root "portfolio-video.mp4"

# 1. Video concat list with holds.
$sb = New-Object System.Text.StringBuilder
foreach ($item in $manifest) {
    $dur = [math]::Round([double]$item.seconds + 0.8, 2)
    [void]$sb.AppendLine("file '$((Join-Path $slides "$($item.id).png"))'")
    [void]$sb.AppendLine("duration $dur")
}
[void]$sb.AppendLine("file '$((Join-Path $slides "$($manifest[-1].id).png"))'")
Set-Content -Path $concat -Value $sb.ToString() -Encoding ascii

# 2. Audio concat list.
$ab = New-Object System.Text.StringBuilder
foreach ($item in $manifest) {
    [void]$ab.AppendLine("file '$((Join-Path $narr "$($item.id).wav"))'")
}
Set-Content -Path $audioList -Value $ab.ToString() -Encoding ascii

# 3. Merge narration WAVs into one track.
Write-Output "Merging narration audio..."
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $audioList -c copy $mergedAudio 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { throw "Audio merge failed" }

# 4. Mux video + audio.
$totalSec = [math]::Round((($manifest | Measure-Object seconds -Sum).Sum) + ($manifest.Count * 0.8), 1)
Write-Output "Rendering $totalSec seconds from $($manifest.Count) slides..."
ffmpeg -hide_banner -loglevel error -stats -y `
  -f concat -safe 0 -i $concat `
  -i $mergedAudio `
  -map 0:v:0 -map 1:a:0 `
  -c:v libx264 -preset medium -crf 20 -r 30 `
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xCCFF00,setsar=1" `
  -c:a aac -b:a 192k -ar 48000 `
  -movflags +faststart `
  $outPath 2>&1 | Out-Host

if ($LASTEXITCODE -ne 0) { throw "Video render failed with exit $LASTEXITCODE" }
if (-not (Test-Path $outPath)) { throw "Output not created" }
$sizeMB = [math]::Round((Get-Item $outPath).Length / 1MB, 1)
Write-Output "DONE: $outPath ($sizeMB MB)"
