# Generate narration WAV files from script.json using Windows SAPI.
# Voice: Microsoft David Desktop (en-US, clear professional male).
param([string]$ScriptFile = "script.json", [string]$OutDir = "narration")

Add-Type -AssemblyName System.Speech

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $root $ScriptFile
$outPath = Join-Path $root $OutDir

if (-not (Test-Path $outPath)) { New-Item -ItemType Directory -Path $outPath | Out-Null }

$data = Get-Content $scriptPath -Raw | ConvertFrom-Json

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $data.voice
try { $synth.SelectVoice($voice) } catch { Write-Warning "Voice '$voice' not found; using default." }

# Rate -1 is a deliberate, professional pace (roughly 115-125 wpm).
$synth.Rate = [int]$data.rate
$synth.Volume = 100

$manifest = @()

foreach ($section in $data.sections) {
    $wav = Join-Path $outPath "$($section.id).wav"
    # Resume-safe: skip sections already rendered.
    if ((Test-Path $wav) -and (Get-Item $wav).Length -gt 10000) {
        $bytes = (Get-Item $wav).Length
        $seconds = [math]::Round($bytes / 32000, 2)
        Write-Output ("{0,-14} SKIPPED (exists) {1,7:n2}s" -f $section.id, $seconds)
        $manifest += [PSCustomObject]@{
            id = $section.id; chapter = $section.chapter; slide = $section.slide
            heading = $section.heading; subheading = $section.subheading
            wav = $wav; seconds = $seconds
        }
        continue
    }
    $synth.SetOutputToWaveFile($wav)
    $synth.Speak($section.narration)
    $synth.SetOutputToNull()

    $bytes = (Get-Item $wav).Length
    # 16 kHz, 16-bit, mono => 32000 bytes per second.
    $seconds = [math]::Round($bytes / 32000, 2)

    Write-Output ("{0,-14} {1,7:n2}s  {2,9:n0} bytes" -f $section.id, $seconds, $bytes)

    $manifest += [PSCustomObject]@{
        id        = $section.id
        chapter   = $section.chapter
        slide     = $section.slide
        heading   = $section.heading
        subheading= $section.subheading
        wav       = $wav
        seconds   = $seconds
    }
}

$synth.Dispose()

$manifestPath = Join-Path $root "manifest.json"
$manifest | ConvertTo-Json -Depth 4 | Set-Content $manifestPath -Encoding utf8

$total = ($manifest | Measure-Object -Property seconds -Sum).Sum
Write-Output ""
Write-Output ("TOTAL NARRATION: {0:n1} seconds ({1:n2} minutes)" -f $total, ($total/60))
Write-Output "Manifest: $manifestPath"
