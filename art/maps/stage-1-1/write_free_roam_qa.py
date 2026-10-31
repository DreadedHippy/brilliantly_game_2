from pathlib import Path
import json

PROJECT=Path(__file__).resolve().parents[3]
OUT=PROJECT/'public/assets/maps/stage-1-1'
def load(path): return json.loads(path.read_text(encoding='utf-8'))
def flags(value):
    result=[]
    if isinstance(value,dict):
        if value.get('status') in ('warn','fail') and 'id' in value: result.append(value)
        for child in value.values(): result.extend(flags(child))
    elif isinstance(value,list):
        for child in value: result.extend(flags(child))
    return result

reports=[OUT/'props/prop-pack.json',OUT/'qa/free-roam-bundle.json',OUT/'qa/free-roam-navigation/nav-report.json',
    PROJECT/'public/assets/sprites/main-hero/directions/qa-flags.json',
    PROJECT/'public/assets/sprites/main-hero/qa-flags.json',PROJECT/'public/assets/sprites/tutorial-elder/qa-flags.json']
records=[]
for report in reports:
    checks=flags(load(report))
    if checks: records.append({'file':report.relative_to(PROJECT).as_posix(),'checks':checks})
text='''# Stage 1-1 free exploration QA

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
'''
(OUT/'QA.md').write_text(text+json.dumps(records,indent=2)+'\n```\n',encoding='utf-8')
print(json.dumps({'qa':str(OUT/'QA.md'),'flaggedReports':len(records)}))
