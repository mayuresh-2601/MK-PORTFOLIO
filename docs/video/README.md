# MAYURESH.DEV — 10-Minute YouTube Portfolio Video

Production-ready 10-minute video walkthrough of the live portfolio at <https://mk-portfolio-phi-silk.vercel.app>.

## Final Outputs

| File | Size | Description |
|---|---|---|
| **`portfolio-video.mp4`** | **15.6 MB** | **The finished video — 1280×720, 9:53, H.264 + AAC, ready to upload** |
| **`thumbnail.png`** | 136 KB | 1280×720 YouTube thumbnail |
| `script.json` | 10 KB | Word-for-word narration + slide copy for 12 sections |
| `script.md` | 3 KB | Human-readable script table with chapters |
| `youtube-metadata.md` | 4 KB | Title options, description, chapters, tags, thumbnail plan |
| `manifest.json` | 4 KB | Per-section durations from ffprobe |
| `narration/` | ~24 MB | 12 WAV files (Microsoft David, en-US) |
| `slides/` | ~1 MB | 12 rendered 1280×720 slide PNGs |
| `narration-full.wav` | 24 MB | Merged narration track |
| `*.ps1` | — | Build scripts (reproducible pipeline) |

## Video Specs

- **Duration:** 00:09:53.90
- **Resolution:** 1280×720 (720p), 30 fps, 16:9
- **Video codec:** H.264 High (yuv444p), CRF 20
- **Audio codec:** AAC-LC, 48 kHz, mono, 192 kb/s
- **Fast start:** Yes (`+faststart` for streaming)
- **Voice:** Microsoft David Desktop, en-US (clear professional)

## Reproduce the build

```powershell
cd docs/video
.\build-narration.ps1   # Generate 12 WAVs with Windows TTS (resume-safe)
.\build-manifest.ps1    # Measure exact durations with ffprobe
.\build-slides.ps1      # Render 12 slides with System.Drawing
.\build-thumbnail.ps1   # Render YouTube thumbnail
.\render-video.ps1      # Merge audio + mux to final MP4
```

## Pipeline notes

1. **Narration** uses Windows built-in SAPI (`System.Speech`), no external service, no API key.
2. **Slides** composite real production screenshots with the brutalist design system (acid #CCFF00, ink #111111, pink #FF33CC).
3. **Durations** are measured from the WAVs with `ffprobe`, so voice and slides stay in sync.
4. **Render** concatenates slides and narration, pads to 720p with acid green, and writes a stream-friendly MP4.

## Upload checklist

- [ ] Upload `portfolio-video.mp4` to YouTube
- [ ] Upload `thumbnail.png` as custom thumbnail
- [ ] Paste description and chapters from `youtube-metadata.md`
- [ ] Add tags from `youtube-metadata.md`
- [ ] Enable auto-captions; review technical terms
- [ ] Category: Education / Science & Technology
- [ ] Add end screen linking to the live site and GitHub repo
