# Directional hero walking QA

Two new image-generated views use the existing accepted hero master: front/down and back/up. Each has eight distinct walk poses and one neutral standing pose. Runtime sheets are 3×3 at 384px per frame, with one [192,320] root and one shared 0.6432160804020101 source-to-runtime scale across both views. In-game body height remains 96px. Native-alpha speck cleanup removes only tiny alpha noise; figures are not resized per frame.

Walking uses 7 ticks per pose at 60Hz, about 8.57fps. Vertical running reuses the same walking poses at 15fps; it is not claimed as a separately generated run cycle. Stopping retains the current facing using the ninth neutral pose. The older side-facing hero bundle is unchanged.

## Measurements and interpretation

The default identity check samples the upper 35% of the body, which includes moving chest/arms in these front/back views. It flagged a 0.94 head-template ratio in down frame 7 and up frame 4, outside its [0.95,1.05] interval. Those original FAIL records are retained verbatim below.

The head-only check was also run with a front head band of 23% and a rear head band of 18%, based on the visible head boundaries in the source and registered sheets. The original ±5% threshold was retained. Both head-only reports pass, without warnings. This distinguishes head matching from upper-body pose matching; it does not prove anatomical or gait quality or erase the broader diagnostics. The side-view leg classifier was not applied to front/back views. All poses, visible extremities, sword handedness, common scale, alpha on light/dark, and playback are visually reviewed separately.

The clip builder reports zero timing or alpha warnings for both directions. Frame transparency, frame bounds, nine unique pixel hashes per direction, and the 18-pose combined preview were checked. Complete reports are under `qa/`; prompts and original generated sheets are included.

Art route: built-in `host-image_gen`, using the user's previously selected frame-by-frame route. Model and cost were not returned. No video or code-drawn character art was substituted.

## Every WARN or FAIL, verbatim

```json
[
  {
    "file": "art/characters/main-hero/directional-v1/qa/down/sheet-qc.json",
    "checks": [
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 1.0,
          "3": 1.0,
          "4": 1.02,
          "5": 1.0,
          "6": 0.96,
          "7": 0.94
        },
        "threshold": [0.95, 1.05],
        "frames": [7],
        "note": "head scale against the median frame (frame 0 template)"
      }
    ]
  },
  {
    "file": "art/characters/main-hero/directional-v1/qa/up/sheet-qc.json",
    "checks": [
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 0.96,
          "3": 1.02,
          "4": 0.94,
          "5": 1.0,
          "6": 1.0,
          "7": 1.0
        },
        "threshold": [0.95, 1.05],
        "frames": [4],
        "note": "head scale against the median frame (frame 0 template)"
      }
    ]
  }
]
```
