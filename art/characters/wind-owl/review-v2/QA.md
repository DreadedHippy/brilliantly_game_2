# Wind owl (descriptive asset label, not a lore name) idle QA

Generated with built-in `host-image_gen` from the matching user reference, then from its accepted transparent master. Model and cost were not returned. The previously selected image-generated frame-by-frame route is retained.

Hovering idle with small coordinated wing flex, feather motion and pale mint wind ribbons. Two feet relaxed in air. Six genuine drawn poses play forward/back as ten steps at 5fps, exactly 2 seconds, with no doubled endpoint. The WebP was decoded to verify ten 200ms frames. Each runtime frame is 512×384 on a shared [256,320] root and one scale; the 256px rest height includes the complete silhouette and effects. Suggested game silhouette height is 80px. This is one right-facing idle view, delivered as an asset and preview.

Native alpha is retained, with only near-transparent alpha-floor noise cleared. Component-ownership slicing recovers overhangs rather than cutting at nominal grid lines. No largest-component filtering, limb manipulation or per-frame resizing is used. The owl uses one translation per source row to remove the source's row-placement jump, retaining within-row airborne motion and wing flex without foot locks. PNG alpha, frame-border clearance and six unique pixel hashes are checked independently of visual anatomy. Raw-sheet layout flags describe the source, not automatically the exported atlas. Active registration: `runtime-v2`; active clips: `clips-v2`. When v2 exists, runtime-frames-v2 and runtime-atlas-v2 are current; the original runtime reports are retained as historical diagnostics of the superseded registration. Read every flag below before acceptance.

Automated silhouette and upper-band identity diagnostics do not approve anatomy or elemental effects. Similar silhouettes may reflect subtle breathing; head-band measurements may include a tree, tall mane, wings or wind ribbons. Visual review of identity, extremities, planted feet or hovering wings, and light/dark transparency is required alongside numerical QA.

## Every WARN or FAIL, verbatim

```json
[
  {
    "file": "art/characters/wind-owl/qa/raw-sheet/sheet-qc.json",
    "checks": [
      {
        "id": "cross_cell_components",
        "status": "fail",
        "value": 3,
        "threshold": 0,
        "cells": [
          [0, 0],
          [1, 1],
          [1, 0]
        ],
        "note": "solid parts crossing a cell line are cut or misassigned when the sheet is sliced"
      },
      {
        "id": "cross_cell_visible",
        "status": "fail",
        "value": 3,
        "threshold": 0,
        "note": "the same test on the visible edge (alpha > 16)"
      },
      {
        "id": "boundary_band",
        "status": "warn",
        "value": 1211,
        "threshold": 0,
        "note": "solid pixels within 10 px of a cell line; a different crop or rounding can cut them"
      },
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
          "floor_px": 140983,
          "detached_components": 34
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      }
    ]
  },
  {
    "file": "art/characters/wind-owl/qa/runtime-atlas/sheet-qc.json",
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
          "floor_px": 0,
          "detached_components": 11
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      }
    ]
  },
  {
    "file": "art/characters/wind-owl/qa/runtime-atlas-v2/sheet-qc.json",
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
          "floor_px": 0,
          "detached_components": 11
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      }
    ]
  },
  {
    "file": "art/characters/wind-owl/qa/runtime-frames/sheet-qc.json",
    "checks": [
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.01,
          "1": 1.03,
          "2": 0.97,
          "3": 0.99,
          "4": 1.03,
          "5": 0.909
        },
        "threshold": [0.95, 1.05],
        "frames": [5],
        "note": "head scale against the median frame (frame 0 template)"
      },
      {
        "id": "torso_drift",
        "status": "warn",
        "value": 7.71,
        "threshold": 2.0,
        "method": "trunk",
        "median_x": 278.6,
        "note": "range of the torso x in game px; scale_frames --root-lock torso-x removes it"
      }
    ]
  },
  {
    "file": "art/characters/wind-owl/qa/runtime-frames-v2/sheet-qc.json",
    "checks": [
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.02,
          "1": 1.02,
          "2": 0.98,
          "3": 0.98,
          "4": 1.041,
          "5": 0.918
        },
        "threshold": [0.95, 1.05],
        "frames": [5],
        "note": "head scale against the median frame (frame 0 template)"
      }
    ]
  }
]
```
