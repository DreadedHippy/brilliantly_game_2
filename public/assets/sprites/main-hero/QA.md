# Main hero asset QA

Generated with the built-in image tool (`host-image_gen`). Model and cost were not returned; price unknown. The user approved frame-by-frame image sheets as the animation route.

The bundle contains a transparent master, 20 unique runtime PNG poses, a 3072×1152 atlas, per-action sheets, Aseprite metadata, three animated WebP previews, source images and prompts. Idle uses four unique poses in a six-step breathing loop; walk and run each use eight unique poses. The common canvas is 384×384, root [192, 320], with 256px rest body height (suggested game display: 96px).

## Review status

These are generated draft animations with unresolved motion heuristics, not a claim that every art check passed. Head/afro scale varies slightly; automatic luminance-based leg-depth checks still flag uncertain or repeated leads. Inspect those before production acceptance. Both trouser legs share cloth colours, which also limits the automatic depth classifier. Source-sheet boundary crossings were recovered with component ownership instead of clipping feet. Walk contact positions were grounded during registration. Run flight was retained. Idle was reduced to the more consistent first four breathing poses.

The alpha, atlas bounds, unique-pose counts, decoded preview timing, byte-copy checks and runtime metadata were checked separately. No code-drawn character animation or generated video was substituted.

## Selected-action WARN and FAIL checks

### idle

Source: `art/characters/main-hero/qa/idle-final-frames/sheet-qc.json`

```json
[
  {
    "id": "near_duplicates",
    "status": "warn",
    "value": [[0, 1]],
    "threshold": 0.95,
    "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
  }
]
```

### walk

Source: `art/characters/main-hero/qa/walk-final-frames/sheet-qc.json`

```json
[
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
  }
]
```

### run

Source: `art/characters/main-hero/qa/run-runtime-frames/sheet-qc.json`

```json
[
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
  }
]
```

## Matte measurements

Measured on keyed source sheets; these do not prove anatomy or motion quality.

```json
{
  "idle": {
    "opaque_key_px": 0,
    "outer_ring_spill_fraction": 0.001779570530312018,
    "semitransparent_fraction": 0.0886026771077533,
    "enclosed_key_pockets": 0,
    "key_hued_px": 74,
    "visible_px": 527659,
    "outer_ring_px": 16858,
    "thresholds": {
      "key_tolerance": 48.0,
      "spill_threshold": 20.0,
      "min_pocket_area": 16,
      "opaque_alpha": 128,
      "spill_hue_balance": 0.5
    },
    "method": "forge_matte.matte_qa v1: straight-colour key distance and dominance on the keyed image; two-channel keys count spill only where the key channels are balanced"
  },
  "walk": {
    "opaque_key_px": 0,
    "outer_ring_spill_fraction": 0.0,
    "semitransparent_fraction": 0.09854115879040418,
    "enclosed_key_pockets": 0,
    "key_hued_px": 123,
    "visible_px": 468454,
    "outer_ring_px": 15846,
    "thresholds": {
      "key_tolerance": 48.0,
      "spill_threshold": 20.0,
      "min_pocket_area": 16,
      "opaque_alpha": 128,
      "spill_hue_balance": 0.5
    },
    "method": "forge_matte.matte_qa v1: straight-colour key distance and dominance on the keyed image; two-channel keys count spill only where the key channels are balanced"
  },
  "run": {
    "opaque_key_px": 0,
    "outer_ring_spill_fraction": 0.0,
    "semitransparent_fraction": 0.10761209412702125,
    "enclosed_key_pockets": 0,
    "key_hued_px": 36,
    "visible_px": 461844,
    "outer_ring_px": 17128,
    "thresholds": {
      "key_tolerance": 48.0,
      "spill_threshold": 20.0,
      "min_pocket_area": 16,
      "opaque_alpha": 128,
      "spill_hue_balance": 0.5
    },
    "method": "forge_matte.matte_qa v1: straight-colour key distance and dominance on the keyed image; two-channel keys count spill only where the key channels are balanced"
  }
}
```

## Every archived WARN and FAIL check

Earlier takes and source-sheet checks are retained verbatim below, including superseded failures. Current-action findings above identify the selected export.

```json
[
  {
    "file": "art/characters/main-hero/qa/idle-final-frames/sheet-qc.json",
    "checks": [
      {
        "id": "near_duplicates",
        "status": "warn",
        "value": [[0, 1]],
        "threshold": 0.95,
        "note": "pairs with best-shift silhouette IoU at or above the threshold and similar colours"
      }
    ]
  },
  {
    "file": "art/characters/main-hero/qa/idle-runtime-frames/sheet-qc.json",
    "checks": [
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
      }
    ]
  },
  {
    "file": "art/characters/main-hero/qa/run-runtime-frames/sheet-qc.json",
    "checks": [
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
      }
    ]
  },
  {
    "file": "art/characters/main-hero/qa/walk-final-frames/sheet-qc.json",
    "checks": [
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
      }
    ]
  },
  {
    "file": "art/characters/main-hero/qa/walk-runtime-frames/sheet-qc.json",
    "checks": [
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
      }
    ]
  },
  {
    "file": "art/characters/main-hero/qa/walk-take-1-spill/sheet-qc.json",
    "checks": [
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
      }
    ]
  },
  {
    "file": "art/characters/main-hero/qa/walk-take-2-spill/sheet-qc.json",
    "checks": [
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
  }
]
```
