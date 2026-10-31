# Bell-mask enemy idle QA

Generated from the user's enemy reference with built-in `host-image_gen`, then animated from its accepted transparent master. Model and cost were not returned. The previously selected image-generated frame-by-frame route is retained. This descriptive asset label does not assign a lore name.

Six drawn inhale poses play forward/back as ten 200ms steps at 5fps, exactly two seconds, with no doubled endpoint. The WebP is decoded to verify that timing. PNG runtime frames are 512×384, with one shared scale, root [256,320] and a 256px rest silhouette including the tall mask. Suggested game silhouette height is 96px. One left-facing three-quarter idle view is supplied; encounter placement and battle logic are separate work.

Two feet remain planted while the robe strips, raffia, bells and faint local cyan wisps move. Component-ownership slicing retains overhangs; only near-transparent alpha-floor noise is cleared. There is no largest-component filtering, anatomy manipulation or per-frame resizing. Soft fringes remain native alpha. PNG transparency, all six unique pose hashes and frame-border clearance are checked independently of artistic quality. Any raw-sheet layout flag must be distinguished from the runtime-atlas report.

The runtime frame check reports no warnings or failures; the clip builder reports zero warnings. The runtime atlas has zero cross-cell parts, zero edge contact and adequate clearance, with one `faint_specks` advisory: floor_px 0, detached_components 1, threshold 0. The fragment is retained for visual review alongside the soft cloth/wisp edges rather than indiscriminately dropping detached art. Source-sheet safe-margin and alpha-noise advisories are preserved separately; these are not export clipping failures.

Numerical head-band, torso, seam and similarity tests are diagnostics, not proof of identity or anatomy. The mask, bells, two blades, fingers, toes, grounded stance, loop joins and light/dark transparency are reviewed alongside the checks. Every WARN/FAIL below is preserved with its exact file, id, value and threshold.

## Every WARN or FAIL, verbatim

```json
[
  {
    "file": "art/characters/bell-mask-enemy/qa/raw-sheet/sheet-qc.json",
    "checks": [
      {
        "id": "safe_frame",
        "status": "warn",
        "value": 6,
        "threshold": 0,
        "cells": [
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 0],
          [1, 1],
          [1, 2]
        ],
        "note": "owned art closer than 15% of the cell to its edge; ask for more margin next time"
      },
      {
        "id": "faint_specks",
        "status": "warn",
        "value": {
          "floor_px": 139906,
          "detached_components": 43
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      }
    ]
  },
  {
    "file": "art/characters/bell-mask-enemy/qa/runtime-atlas/sheet-qc.json",
    "checks": [
      {
        "id": "faint_specks",
        "status": "warn",
        "value": {
          "floor_px": 0,
          "detached_components": 1
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      }
    ]
  }
]
```
