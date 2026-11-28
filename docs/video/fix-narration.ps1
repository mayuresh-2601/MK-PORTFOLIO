Add-Type -AssemblyName System.Speech
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$narr = Join-Path $root "narration"
$data = Get-Content (Join-Path $root "script.json") -Raw | ConvertFrom-Json

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try { $synth.SelectVoice($data.voice) } catch { Write-Warning "Using default voice" }
$synth.Rate = [int]$data.rate
$synth.Volume = 100

foreach ($id in @("03-design", "12-outro")) {
    $section = $data.sections | Where-Object { $_.id -eq $id }
    if (-not $section) { Write-Warning "Missing section $id"; continue }
    $wav = Join-Path $narr "$id.wav"
    if (Test-Path $wav) { Remove-Item $wav -Force }
    $synth.SetOutputToWaveFile($wav)
    $synth.Speak($section.narration)
    $synth.SetOutputToNull()
    $sec = [math]::Round((Get-Item $wav).Length / 32000, 2)
    Write-Output ("{0,-14} {1,7:n2}s" -f $id, $sec)
}
$synth.Dispose()
