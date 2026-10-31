"""Publish exact diagnostics, a verified WebP and the complete enemy asset bundle."""
from pathlib import Path
import json, shutil, runpy
from PIL import Image

ART=Path(__file__).resolve().parent
ROOT=ART.parents[2]
OUT=ROOT/'public/assets/sprites/bell-mask-enemy'

def flags(value):
    result=[]
    if isinstance(value,dict):
        if value.get('status') in ('warn','fail') and 'id' in value: result.append(value)
        for child in value.values(): result.extend(flags(child))
    elif isinstance(value,list):
        for child in value: result.extend(flags(child))
    return result

def main():
    reports=[ART/'master-v1/master.json',ART/'processed-v1/animation.json',ART/'runtime-v1/scale-frames.json',ART/'clips-v1/animation-clips.json',*sorted((ART/'qa').glob('*/sheet-qc.json'))]
    findings=[]
    for path in reports:
        data=json.loads(path.read_text(encoding='utf-8')); checks=flags(data)
        shutil.copy2(path,OUT/'qa'/f'{path.parent.name}-{path.name}')
        if checks: findings.append({'file':path.relative_to(ROOT).as_posix(),'checks':checks})
    shutil.copy2(next((ART/'clips-v1/clips').glob('*.webp')),OUT/'idle.webp')
    with Image.open(OUT/'idle.webp') as im:
        durations=[]
        for i in range(im.n_frames):
            im.seek(i); im.load(); durations.append(im.info.get('duration'))
        assert durations==[200]*10, durations
    (OUT/'qa-flags.json').write_text(json.dumps(findings,indent=2)+'\n',encoding='utf-8')
    text='''# Bell-mask enemy idle QA

Generated from the user's enemy reference with built-in `host-image_gen`, then animated from its accepted transparent master. Model and cost were not returned. The previously selected image-generated frame-by-frame route is retained. This descriptive asset label does not assign a lore name.

Six drawn inhale poses play forward/back as ten 200ms steps at 5fps, exactly two seconds, with no doubled endpoint. The WebP is decoded to verify that timing. PNG runtime frames are 512×384, with one shared scale, root [256,320] and a 256px rest silhouette including the tall mask. Suggested game silhouette height is 96px. One left-facing three-quarter idle view is supplied; encounter placement and battle logic are separate work.

Two feet remain planted while the robe strips, raffia, bells and faint local cyan wisps move. Component-ownership slicing retains overhangs; only near-transparent alpha-floor noise is cleared. There is no largest-component filtering, anatomy manipulation or per-frame resizing. Soft fringes remain native alpha. PNG transparency, all six unique pose hashes and frame-border clearance are checked independently of artistic quality. Any raw-sheet layout flag must be distinguished from the runtime-atlas report.

The runtime frame check reports no warnings or failures; the clip builder reports zero warnings. The runtime atlas has zero cross-cell parts, zero edge contact and adequate clearance, with one `faint_specks` advisory: floor_px 0, detached_components 1, threshold 0. The fragment is retained for visual review alongside the soft cloth/wisp edges rather than indiscriminately dropping detached art. Source-sheet safe-margin and alpha-noise advisories are preserved separately; these are not export clipping failures.

Numerical head-band, torso, seam and similarity tests are diagnostics, not proof of identity or anatomy. The mask, bells, two blades, fingers, toes, grounded stance, loop joins and light/dark transparency are reviewed alongside the checks. Every WARN/FAIL below is preserved with its exact file, id, value and threshold.

## Every WARN or FAIL, verbatim

```json
'''
    (OUT/'QA.md').write_text(text+json.dumps(findings,indent=2)+'\n```\n',encoding='utf-8')
    runpy.run_path(str(ART/'package.py'))['archive']()
    print(json.dumps({'frames':10,'durationMs':2000,'flaggedReports':len(findings)}))

if __name__=='__main__': main()
