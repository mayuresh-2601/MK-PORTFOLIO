# Build manifest.json with accurate WAV durations from ffprobe.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$data = Get-Content (Join-Path $root "script.json") -Raw | ConvertFrom-Json
$narr = Join-Path $root "narration"

$manifest = @()
foreach ($section in $data.sections) {
    $wav = Join-Path $narr "$($section.id).wav"
    if (-not (Test-Path $wav)) { throw "Missing narration: $wav" }
    $dur = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 $wav)
    $manifest += [PSCustomObject]@{
        id         = $section.id
        chapter    = $section.chapter
        slide      = $section.slide
        heading    = $section.heading
        subheading = $section.subheading
        wav        = $wav
        seconds    = [math]::Round($dur, 2)
    }
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $root "manifest.json") -Encoding utf8
$total = ($manifest | Measure-Object seconds -Sum).Sum
Write-Output ("Manifest rebuilt: {0:n1}s ({1:n2} min)" -f $total, ($total/60))
