# Tutorial elder idle QA

Built-in image generation (`host-image_gen`), native transparency. Model and price were not returned.

Six unique breathing poses play forward and backward without repeating the endpoints: ten playback steps, 5 fps, 2 seconds. Fixed 384×384 canvas, root [192,320], 256px rest-height; suggested in-game seated height 72px alongside the 96px standing hero.

The raw generated sheet had tight source-cell margins and faint alpha specks. Equal 128px transparent padding was added to every cell, and native-alpha hygiene removed floor haze and detached tiny specks without reposing or rescaling the character. Prepared-sheet QA is included alongside the historical raw-source findings. Numerical QA findings are included verbatim below. Subtle idle poses can produce near-duplicate silhouette warnings; distinct pixel hashes are checked separately. Any remaining FAIL is a review issue, not a production approval.

## Every WARN and FAIL check

```json
[
  {
    "file": "art/characters/tutorial-elder/qa/raw-sheet/sheet-qc.json",
    "checks": [
      {
        "location": "/checks/5",
        "check": {
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
        }
      },
      {
        "location": "/checks/6",
        "check": {
          "id": "faint_specks",
          "status": "warn",
          "value": {
            "floor_px": 116135,
            "detached_components": 14
          },
          "threshold": 0,
          "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
        }
      }
    ]
  },
  {
    "file": "art/characters/tutorial-elder/qa/runtime-final/sheet-qc.json",
    "checks": [
      {
        "location": "/checks/2",
        "check": {
          "id": "near_duplicates",
          "status": "warn",
          "value": [
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
            [1, 2],
            [1, 3],
            [1, 4],
            [2, 3],
            [2, 4],
            [3, 4],
            [4, 5]
          ],
          "threshold": 0.95,
          "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
        }
      }
    ]
  },
  {
    "file": "art/characters/tutorial-elder/qa/runtime-frames/sheet-qc.json",
    "checks": [
      {
        "location": "/checks/2",
        "check": {
          "id": "near_duplicates",
          "status": "warn",
          "value": [
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
            [1, 2],
            [1, 3],
            [1, 4],
            [2, 3],
            [2, 4],
            [3, 4],
            [4, 5]
          ],
          "threshold": 0.95,
          "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
        }
      }
    ]
  }
]
```

## Alpha processing

```json
{
  "mode": "native_alpha",
  "keying": "none",
  "alphaExtrema": [0, 254],
  "transparentPixels": 849915,
  "visiblePixelsOver127": 587716
}
```

Review the loop over light, dark and checker backgrounds, especially the palm, beard, fringes, staff, stool and planted feet. One view and one idle action only. Numeric checks cannot approve artistic anatomy.
