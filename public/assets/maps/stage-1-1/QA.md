# Stage 1-1 free exploration QA

The mentor is named **Arojinle**. The main character can walk across the grass and the road throughout the level. The visual road is a landmark, not a movement boundary. Tutorial, battles and the next-stage transition remain inactive.

## Movement and presentation

`layout.json` owns the playable bounds, NPC and camera. `environment.json` owns prop footprints. `worldMovement.ts` integrates bounded movement in small steps, resolves foot collisions, and caches a navigation grid for obstacle-aware tap routes. Clear taps use direct travel across grass; blocked taps get a smoothed detour around trunks, rocks, signs, jars and Arojinle. Grass does not block movement.

Up and down use newly image-generated back- and front-facing walk cycles, with a neutral pose when stopped. Both use the existing 384px canvas, [192,320] root and 96px game-body scale. Vertical running accelerates the walking poses; it is not a separate authored run animation. Existing side-view animation is unchanged. Full directional provenance, original prompts, source sheets and QA are in `../../sprites/main-hero/directions/`.

Characters and scenery retain Y sorting. A cached alpha comparison between the current actor frame and a nearer tree canopy enables a faint actor-shaped cue where real pixels overlap. Trees remain fully opaque; image rectangles alone do not trigger the cue. The camera remains at fixed 1.15 zoom with deadzone, look-ahead, frame-rate-independent smoothing and world bounds.

## Validation and remaining diagnostics

`qa/free-roam-bundle.json` records zero map-contract errors and warnings. `qa/free-roam-navigation/nav-report.json` proves all eight authored targets reachable from the arrival spawn: the four encounters, Arojinle's approach, the exit and two off-road meadows. No target is unreachable and no thin gap is reported. One isolated 7px navigation grid cell is reported as a warning; its exact measurement is retained below.

`art/maps/stage-1-1/preview-v2/preview.html` is the current authored QA view. Project-owned Playwright checks call its actual collision runtime's `traverseAll()` for all eight targets. The older preview-v1 and original navigation reports are historical road-only artifacts. The authored overview is not an in-level zoom control.

Browser checks cover both directional animations, off-road keyboard and tap movement, detouring around Arojinle, the canopy cue without tree fading, fixed zoom, cancelled touches, focus loss, re-entry, image failure/retry, reduced motion and the full route to the exit. Pure tests cover direct free travel, solid footprints, target adjustment, frame-rate consistency and world bounds.

The directional sprite's default 35%-body template includes moving shoulders/chest and reports a 0.94 ratio in one pose per view. Head-only bands (23% front, 18% rear) pass the unchanged +/-5% threshold. Both original diagnostics and head-only results are retained. Numeric results do not approve anatomy or gait. Existing side-view sprite warnings and the prop extractor's 126 unowned small/faint pixels remain documented.

Art route is built-in `host-image_gen`; model and cost were not returned. Sources and exact prompts are retained. No code-drawn character art or generated video was substituted. Physical-device performance was not certified by desktop/emulated browser testing.

## Every WARN or FAIL from the referenced published envelopes, verbatim

```json
[
  {
    "file": "public/assets/maps/stage-1-1/props/prop-pack.json",
    "checks": [
      {
        "id": "auto_box_unowned",
        "status": "warn",
        "value": 126,
        "threshold": 0
      }
    ]
  },
  {
    "file": "public/assets/maps/stage-1-1/qa/free-roam-navigation/nav-report.json",
    "checks": [
      {
        "id": "unreachable_walkable_area",
        "status": "warn",
        "value": {
          "pockets": 1,
          "cells": 1
        },
        "threshold": "reported"
      }
    ]
  },
  {
    "file": "public/assets/sprites/main-hero/directions/qa-flags.json",
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
      },
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
  },
  {
    "file": "public/assets/sprites/main-hero/qa-flags.json",
    "checks": [
      {
        "id": "near_duplicates",
        "status": "warn",
        "value": [[0, 1]],
        "threshold": 0.95,
        "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
      },
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 1.0,
          "3": 1.0,
          "4": 1.0,
          "5": 0.94,
          "6": 1.0,
          "7": 1.0
        },
        "threshold": [0.95, 1.05],
        "frames": [5],
        "note": "head scale against the median frame (frame 0 template)"
      },
      {
        "id": "leg_alternation",
        "status": "fail",
        "value": [
          "near",
          "near",
          "near",
          "near",
          "near",
          "near",
          "near",
          "unclear"
        ],
        "threshold": "lead differs between i and i+n/2",
        "verdict": "duplicated half-cycle: the same leg leads in both halves",
        "pairs": [
          [0, 4, true],
          [1, 5, true],
          [2, 6, true]
        ],
        "mode": "auto-luminance",
        "near_leading": 7,
        "unclear": 1,
        "half_cycle": {
          "pairs": [
            {
              "pair": [0, 4],
              "iou_best_shift": 0.8438
            },
            {
              "pair": [1, 5],
              "iou_best_shift": 0.7034
            },
            {
              "pair": [2, 6],
              "iou_best_shift": 0.6944
            },
            {
              "pair": [3, 7],
              "iou_best_shift": 0.8741
            }
          ],
          "adjacent_iou_median": 0.6673,
          "half_cycle_iou_median": 0.7736
        },
        "fix": "regenerate frames 4-7 with NEAR and FAR swapped (attach frames 0-3 and the guide)"
      },
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 1.0,
          "3": 1.0,
          "4": 0.94,
          "5": 0.94,
          "6": 1.0,
          "7": 1.02
        },
        "threshold": [0.95, 1.05],
        "frames": [4, 5],
        "note": "head scale against the median frame (frame 0 template)"
      },
      {
        "id": "phase_coverage",
        "status": "warn",
        "value": [
          ["contact", "narrow", "mid", "flight"],
          ["narrow", "narrow", "narrow", "flight"]
        ],
        "threshold": null,
        "problems": ["half 1 has no wide-stride contact frame"],
        "note": "labels from ground clearance and stride width; they cannot judge the pose itself"
      },
      {
        "id": "leg_alternation",
        "status": "fail",
        "value": [
          "near",
          "unclear",
          "far",
          "near",
          "unclear",
          "far",
          "unclear",
          "near"
        ],
        "threshold": "lead differs between i and i+n/2",
        "verdict": "duplicated half-cycle: the same leg leads in both halves",
        "pairs": [[3, 7, true]],
        "mode": "auto-luminance",
        "near_leading": 3,
        "unclear": 3,
        "half_cycle": {
          "pairs": [
            {
              "pair": [0, 4],
              "iou_best_shift": 0.7686
            },
            {
              "pair": [1, 5],
              "iou_best_shift": 0.634
            },
            {
              "pair": [2, 6],
              "iou_best_shift": 0.7026
            },
            {
              "pair": [3, 7],
              "iou_best_shift": 0.6967
            }
          ],
          "adjacent_iou_median": 0.6523,
          "half_cycle_iou_median": 0.6996
        },
        "fix": "regenerate frames 4-7 with NEAR and FAR swapped (attach frames 0-3 and the guide)"
      },
      {
        "id": "near_duplicates",
        "status": "warn",
        "value": [[0, 1]],
        "threshold": 0.95,
        "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
      },
      {
        "id": "near_duplicates",
        "status": "warn",
        "value": [
          [0, 1],
          [0, 4],
          [0, 5],
          [4, 5],
          [6, 7]
        ],
        "threshold": 0.95,
        "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
      },
      {
        "id": "seam",
        "status": "warn",
        "value": 1.81,
        "threshold": 1.5,
        "transitions": [[3, 4]],
        "note": "largest frame-to-frame change over the median step; review these joins first"
      },
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 1.0,
          "3": 1.0,
          "4": 0.94,
          "5": 0.94,
          "6": 1.0,
          "7": 1.02
        },
        "threshold": [0.95, 1.05],
        "frames": [4, 5],
        "note": "head scale against the median frame (frame 0 template)"
      },
      {
        "id": "phase_coverage",
        "status": "warn",
        "value": [
          ["contact", "narrow", "mid", "flight"],
          ["narrow", "narrow", "narrow", "flight"]
        ],
        "threshold": null,
        "problems": ["half 1 has no wide-stride contact frame"],
        "note": "labels from ground clearance and stride width; they cannot judge the pose itself"
      },
      {
        "id": "leg_alternation",
        "status": "fail",
        "value": [
          "near",
          "unclear",
          "far",
          "near",
          "unclear",
          "far",
          "unclear",
          "near"
        ],
        "threshold": "lead differs between i and i+n/2",
        "verdict": "duplicated half-cycle: the same leg leads in both halves",
        "pairs": [[3, 7, true]],
        "mode": "auto-luminance",
        "near_leading": 3,
        "unclear": 3,
        "half_cycle": {
          "pairs": [
            {
              "pair": [0, 4],
              "iou_best_shift": 0.7686
            },
            {
              "pair": [1, 5],
              "iou_best_shift": 0.634
            },
            {
              "pair": [2, 6],
              "iou_best_shift": 0.7026
            },
            {
              "pair": [3, 7],
              "iou_best_shift": 0.6967
            }
          ],
          "adjacent_iou_median": 0.6523,
          "half_cycle_iou_median": 0.6996
        },
        "fix": "regenerate frames 4-7 with NEAR and FAR swapped (attach frames 0-3 and the guide)"
      },
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 1.0,
          "3": 1.0,
          "4": 1.0,
          "5": 0.94,
          "6": 1.0,
          "7": 1.0
        },
        "threshold": [0.95, 1.05],
        "frames": [5],
        "note": "head scale against the median frame (frame 0 template)"
      },
      {
        "id": "leg_alternation",
        "status": "fail",
        "value": [
          "near",
          "near",
          "near",
          "near",
          "near",
          "near",
          "near",
          "unclear"
        ],
        "threshold": "lead differs between i and i+n/2",
        "verdict": "duplicated half-cycle: the same leg leads in both halves",
        "pairs": [
          [0, 4, true],
          [1, 5, true],
          [2, 6, true]
        ],
        "mode": "auto-luminance",
        "near_leading": 7,
        "unclear": 1,
        "half_cycle": {
          "pairs": [
            {
              "pair": [0, 4],
              "iou_best_shift": 0.8438
            },
            {
              "pair": [1, 5],
              "iou_best_shift": 0.7034
            },
            {
              "pair": [2, 6],
              "iou_best_shift": 0.6944
            },
            {
              "pair": [3, 7],
              "iou_best_shift": 0.8741
            }
          ],
          "adjacent_iou_median": 0.6673,
          "half_cycle_iou_median": 0.7736
        },
        "fix": "regenerate frames 4-7 with NEAR and FAR swapped (attach frames 0-3 and the guide)"
      },
      {
        "id": "identity_head_ratio",
        "status": "fail",
        "value": {
          "0": 1.0,
          "1": 1.0,
          "2": 1.0,
          "3": 1.0,
          "4": 1.0,
          "5": 0.94,
          "6": 0.94,
          "7": 1.0
        },
        "threshold": [0.95, 1.05],
        "frames": [5, 6],
        "note": "head scale against the median frame (frame 0 template)"
      },
      {
        "id": "phase_coverage",
        "status": "warn",
        "value": [
          ["flight", "narrow", "narrow", "flight"],
          ["contact", "mid", "flight", "contact"]
        ],
        "threshold": null,
        "problems": [
          "half 0 has no wide-stride contact frame",
          "half 0 leaves the ground; a walk keeps one foot down",
          "half 1 leaves the ground; a walk keeps one foot down"
        ],
        "note": "labels from ground clearance and stride width; they cannot judge the pose itself"
      },
      {
        "id": "leg_alternation",
        "status": "fail",
        "value": [
          "near",
          "unclear",
          "unclear",
          "near",
          "near",
          "unclear",
          "near",
          "unclear"
        ],
        "threshold": "lead differs between i and i+n/2",
        "verdict": "duplicated half-cycle: the same leg leads in both halves",
        "pairs": [[0, 4, true]],
        "mode": "auto-luminance",
        "near_leading": 4,
        "unclear": 4,
        "half_cycle": {
          "pairs": [
            {
              "pair": [0, 4],
              "iou_best_shift": 0.8031
            },
            {
              "pair": [1, 5],
              "iou_best_shift": 0.691
            },
            {
              "pair": [2, 6],
              "iou_best_shift": 0.7008
            },
            {
              "pair": [3, 7],
              "iou_best_shift": 0.7727
            }
          ],
          "adjacent_iou_median": 0.6961,
          "half_cycle_iou_median": 0.7368
        },
        "fix": "regenerate frames 4-7 with NEAR and FAR swapped (attach frames 0-3 and the guide)"
      },
      {
        "id": "boundary_band",
        "status": "warn",
        "value": 484,
        "threshold": 0,
        "note": "solid pixels within 8 px of a cell line; a different crop or rounding can cut them"
      },
      {
        "id": "safe_frame",
        "status": "warn",
        "value": 8,
        "threshold": 0,
        "cells": [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [1, 0],
          [1, 1],
          [1, 2],
          [1, 3]
        ],
        "note": "owned art closer than 15% of the cell to its edge; ask for more margin next time"
      },
      {
        "id": "cross_cell_components",
        "status": "fail",
        "value": 1,
        "threshold": 0,
        "cells": [[1, 0]],
        "note": "solid parts crossing a cell line are cut or misassigned when the sheet is sliced"
      },
      {
        "id": "cross_cell_visible",
        "status": "fail",
        "value": 1,
        "threshold": 0,
        "note": "the same test on the visible edge (alpha > 16)"
      },
      {
        "id": "boundary_band",
        "status": "warn",
        "value": 347,
        "threshold": 0,
        "note": "solid pixels within 8 px of a cell line; a different crop or rounding can cut them"
      },
      {
        "id": "safe_frame",
        "status": "warn",
        "value": 8,
        "threshold": 0,
        "cells": [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [1, 0],
          [1, 1],
          [1, 2],
          [1, 3]
        ],
        "note": "owned art closer than 15% of the cell to its edge; ask for more margin next time"
      }
    ]
  },
  {
    "file": "public/assets/sprites/tutorial-elder/qa-flags.json",
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
          "floor_px": 116135,
          "detached_components": 14
        },
        "threshold": 0,
        "note": "alpha haze and detached specks; process removes them with --alpha-hygiene both"
      },
      {
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
      },
      {
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
    ]
  }
]
```
