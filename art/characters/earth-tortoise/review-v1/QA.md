# Earth tortoise (descriptive asset label, not a lore name) idle QA

Generated with built-in `host-image_gen` from the matching user reference, then from its accepted transparent master. Model and cost were not returned. The previously selected image-generated frame-by-frame route is retained.

Slow breathing, tiny relaxed head lift, emerald crystal glow and baobab leaf movement. Four feet planted. Six genuine drawn poses play forward/back as ten steps at 5fps, exactly 2 seconds, with no doubled endpoint. The WebP was decoded to verify ten 200ms frames. Each runtime frame is 512×384 on a shared [256,320] root and one scale; the 256px rest height includes the complete silhouette and effects. Suggested game silhouette height is 80px. This is one right-facing idle view, delivered as an asset and preview.

Native alpha is retained, with only near-transparent alpha-floor noise cleared. Component-ownership slicing recovers overhangs rather than cutting at nominal grid lines. No largest-component filtering, limb manipulation or per-frame resizing is used. The owl retains airborne motion rather than applying ground/foot locks. PNG alpha, frame-border clearance and six unique pixel hashes are checked independently of visual anatomy. Raw-sheet layout flags describe the source, not automatically the exported atlas: inspect the separate runtime-atlas report for export integrity. Read every current flag below before acceptance.

Automated silhouette and upper-band identity diagnostics do not approve anatomy or elemental effects. Similar silhouettes may reflect subtle breathing; head-band measurements may include a tree, tall mane, wings or wind ribbons. Visual review of identity, extremities, planted feet or hovering wings, and light/dark transparency is required alongside numerical QA.

## Every WARN or FAIL, verbatim

```json
[
  {
    "file": "art/characters/earth-tortoise/qa/raw-sheet/sheet-qc.json",
    "checks": [
      {
        "id": "boundary_band",
        "status": "warn",
        "value": 18,
        "threshold": 0,
        "note": "solid pixels within 10 px of a cell line; a different crop or rounding can cut them"
      },
      {
        "id": "safe_frame",
        "status": "warn",
        "value": 6,
        "threshold": 0,
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "note": "owned art closer than 15% of the cell to its edge; ask for more margin next time"
      },
      {
        "id": "faint_specks",
        "status": "warn",
        "value": {
          "floor_px": 91410,
          "detached_components": 7
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      }
    ]
  },
  {
    "file": "art/characters/earth-tortoise/qa/runtime-atlas/sheet-qc.json",
    "checks": [
      {
        "id": "safe_frame",
        "status": "warn",
        "value": 6,
        "threshold": 0,
        "cells": [
          [
            0,
            0
          ],
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            0
          ],
          [
            1,
            1
          ],
          [
            1,
            2
          ]
        ],
        "note": "owned art closer than 15% of the cell to its edge; ask for more margin next time"
      }
    ]
  },
  {
    "file": "art/characters/earth-tortoise/qa/runtime-frames/sheet-qc.json",
    "checks": [
      {
        "id": "near_duplicates",
        "status": "warn",
        "value": [
          [
            0,
            1
          ],
          [
            0,
            2
          ],
          [
            1,
            2
          ],
          [
            3,
            4
          ],
          [
            4,
            5
          ]
        ],
        "threshold": 0.95,
        "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
      }
    ]
  }
]
```
