"""Summarise retained final map QA without suppressing prop or sprite warnings."""
from pathlib import Path
import json

PROJECT = Path(__file__).resolve().parents[3]
OUT = PROJECT / 'public/assets/maps/stage-1-1'

def load(path): return json.loads(path.read_text(encoding='utf-8'))

def warnings(value, path=''):
    result = []
    if isinstance(value, dict):
        if value.get('status') in ('warn', 'fail') and 'id' in value:
            result.append({'location': path, 'check': value})
        for key, child in value.items(): result.extend(warnings(child, f'{path}/{key}'))
    elif isinstance(value, list):
        for index, child in enumerate(value): result.extend(warnings(child, f'{path}/{index}'))
    return result

reports = [OUT/'props/prop-pack.json', OUT/'qa/bundle-final.json', OUT/'qa/navigation-final/nav-report.json']
flags = [{'file': path.relative_to(PROJECT).as_posix(), 'checks': warnings(load(path))} for path in reports]
flags = [record for record in flags if record['checks']]
sprite_reports = [PROJECT/'public/assets/sprites/main-hero/qa-flags.json', PROJECT/'public/assets/sprites/tutorial-elder/qa-flags.json']
for source in sprite_reports:
    checks = warnings(load(source))
    if checks: flags.append({'file': source.relative_to(PROJECT).as_posix(), 'checks': checks})
text = '''# Stage 1-1 implementation QA

The first world-map destination, River crossing, now opens Stage 1-1. The level follows the user's winding outline: a starting grove with Arojinle, four reserved encounter positions, the low pass, the rising ridge, and a closed Stage 1-2 exit.

## Verified behavior

- Generated main-character idle/walk/run sprites and the mentor's seated idle are integrated with ground anchors and depth sorting.
- Keyboard, click/tap routing and native touch buttons move the character; Shift and the touch Run toggle select the run animation.
- The follow camera uses a deadzone, look-ahead, time-based smoothing, a fixed 1.15 zoom and world-edge bounds. Wheel, pinch and zoom keys do not change level zoom. World-map navigation is independently restored on return.
- Foot collision keeps the player on the road and outside the seated NPC's ground footprint. Tap routes follow the road around its bends.
- The full trail was traversed in the real Phaser scene through normal canvas clicks to the exit. Loading failure and retry, re-entry, focus loss, reduced motion, narrow screens and cancelled touch input are covered by browser checks.
- Tutorial dialogue, battle triggers, enemy actors and Stage 1-2 entry are inactive. Encounter positions are marked for the next development step.

## Map contract and route proof

`qa/bundle-final.json`: zero errors and zero warnings from `map_bundle.py validate`.

`qa/navigation-final/nav-report.json`: all six targets reachable from the arrival spawn; zero unreachable targets and zero thin gaps, actor radius 14, navigation cell 7. The six targets are the four encounter positions, the mentor approach and the exit.

The skill's `build_scene_preview.py` produced `art/maps/stage-1-1/preview-v1/preview.html`. Its JavaScript collision runtime was then exercised by the project-owned Playwright test, with `traverseAll().ok === true` for every target. The script's separate `--verify` option was not used; the project tests use installed Chrome. The authored overview is a developer QA view; it is not a zoom control in the playable level.

`layout.json` is canonical. The terrain compositor and TypeScript controller sample the same Catmull-Rom centre line. The rendered road mask and the validation bundle use the matching ribbon polygon; the runtime retains a 2px interior safety margin. Texture panels and prop sprites use uniform scale and explicit anchors.

## Provenance and limits

Terrain and prop art came from the built-in image tool (`host-image_gen`). Model and cost were not returned. Original images and exact prompts are retained in `art/maps/stage-1-1/`; the public provenance file records hashes and the complete prompts. The ground is composed from generated grass and earth materials, not a claim that the whole map was generated as one painting.

The prop extractor retained all six props and reports no edge-touch or dropped-area failure. It flags 126 unowned small/faint source pixels (`auto_box_unowned`, threshold 0); this advisory remains documented. Existing character art warnings are retained from the sprite bundles. No anatomy or motion approval is inferred from numerical tests. The input and browser devices tested are desktop Chrome and emulated narrow/touch layouts, not a physical-device performance certification.

## Every published WARN or FAIL check, verbatim

The records below include source artifact paths and exact values/thresholds. Sprite records include historical take warnings preserved with those bundles. They are separate from the successful current map contract, navigation, and behavior checks.

```json
'''
(OUT/'QA.md').write_text(text + json.dumps(flags, indent=2) + '\n```\n', encoding='utf-8')
print(json.dumps({'report': str(OUT/'QA.md'), 'flaggedReports': len(flags)}))
