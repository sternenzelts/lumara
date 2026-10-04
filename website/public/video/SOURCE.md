# Lumara website trailer

- [Playback MP4](lumara-anima-trailer.mp4): derived from the preserved [reviewed v4 master](../../../trailer/output/lumara-anima-trailer-v4-reviewed.mp4).
- [Poster](poster.jpg): Seren's dawn smile, extracted from that master at 84.5 seconds and scaled to 1280 × 720.
- Music: **ANIMA — ReoNa**, the first 90 seconds of the user's local audio, with the master's one-second ending fade.
- Visuals: Lumara game artwork and generated anime keyframes. See [trailer production notes](../../../trailer/README.md), [image-generation prompts](../../../trailer/assets/v4/prompts-clashes.md), and [Upscayl provenance](../../../trailer/tools/upscayl/PROVENANCE.md).

The web copy is 1280 × 720, constant 30 fps, 90 seconds / 2700 video frames, H.264 High Level 3.1 with `yuv420p`, and stereo AAC at 48 kHz / 128 kbps. FFmpeg used two-pass libx264 with the slow preset, 1150 kbps analysis and a 1140 kbps final video target, a 2600 kbps maximum, and MP4 faststart. The source's full-range BT.601 matrix was converted to limited-range BT.709 during scaling.

Verification: video and audio decode end to end without errors; MP4 metadata precedes media for progressive playback. Compressed frames at 32.6, 61.6, and 84.5 seconds were visually inspected. The video is **14,454,974 bytes** and the poster is **218,543 bytes**, beneath the website's 15 MiB per-file limit. Machine-readable verification is kept in [web-encode/verification.json](../../../trailer/output/web-encode/verification.json).

Original master SHA256: `dbc05733c7bb9cd297e3084cd0465375f60ef3350e7d785f1b3cd031e4cc18e6`.

## Re-encode (Claude, 2026-10-04)
The playback MP4 above was replaced with a sharper encode of the same `v4-reviewed` master, still under the 15 MiB per-file limit:
- **Letterbox bars cropped:** the master's baked 72 px black bars are cropped out (1920×936 → **1280×624**). The player's 16:9 black stage still shows them, so the look is unchanged, but no bits are spent on black.
- **Encoder:** two-pass libx264 **veryslow**, `-tune animation`, 1170 kbps target / 2600 kbps max, High profile, yuv420p, faststart. AAC 112 kbps / 48 kHz.
- **Size:** 14,584,450 bytes.
- **Measured against the master:** PSNR 33.2 dB vs 31.5 dB (close-ups, 52.2 s) and 31.1 dB vs 26.9 dB (fight, 62.0 s).
- **Codex's 720p copy:** kept at `trailer/output/web-encode/codex-720p-original.mp4`.

## Full-quality master (Claude, 2026-10-04)
The playback MP4 is now the **reviewed v4 master itself, unchanged** (SHA256 `dbc05733…18e6`, 176,975,764 bytes, 1920×1080, ~15.5 Mbps). It is stored in Git LFS because it exceeds GitHub's 100 MB per-file limit. A near-lossless re-encode (x264 CRF 17) was tested and still came out at 163 MB, so no compressed copy is shipped. The sections above describe the earlier compressed web copies.
