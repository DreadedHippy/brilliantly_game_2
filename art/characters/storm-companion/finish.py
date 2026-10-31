"""Publish exact Forge QA, verified animated preview and the complete standalone bundle."""
from pathlib import Path
import json
import shutil
import runpy

ART=Path(__file__).resolve().parent
PROJECT=ART.parents[2]
OUT=PROJECT/'public/assets/sprites/storm-companion'
def flags(value):
    result=[]
    if isinstance(value,dict):
        if value.get('status') in ('warn','fail') and 'id' in value: result.append(value)
        for child in value.values(): result.extend(flags(child))
    elif isinstance(value,list):
        for child in value: result.extend(flags(child))
    return result

reports=[ART/'master-v1/master.json',ART/'processed-v1/animation.json',ART/'runtime-v1/scale-frames.json',ART/'clips-v1/animation-clips.json',*sorted((ART/'qa').glob('*/sheet-qc.json'))]
findings=[]
for path in reports:
    data=json.loads(path.read_text(encoding='utf-8')); checks=flags(data)
    shutil.copy2(path,OUT/'qa'/f'{path.parent.name}-{path.name}')
    if checks: findings.append({'file':path.relative_to(PROJECT).as_posix(),'checks':checks})
shutil.copy2(next((ART/'clips-v1/clips').glob('*.webp')),OUT/'idle.webp')
(OUT/'qa-flags.json').write_text(json.dumps(findings,indent=2)+'\n',encoding='utf-8')
text='''# Storm companion idle QA

Generated from the user's creature reference using built-in `host-image_gen`. Model and cost were not returned. The existing frame-by-frame image route selected by the user was used; no video generation or code-drawn creature art was substituted.

Six unique illustrated poses form a slow inhale and play forward/back as ten steps at 5fps: exactly 2 seconds. Each runtime frame is 512×384 with a shared [256,320] root. One scale is used for all poses; there is no per-frame bbox resizing or limb manipulation. Suggested game silhouette height is 80px. This includes the horns and curled storm tail, not shoulder height. It is one left-facing three-quarter view, provided as an asset rather than a level integration or following AI.

Native alpha is retained. Tiny alpha-floor noise is cleared; faint attached or detached cloud/electrical fringes are otherwise preserved. No magenta chroma key or largest-component filter is used. The raw image had effects crossing nominal source-cell boundaries: component ownership recovered them instead of cutting at grid lines. Do not directly grid-slice the raw generated sheet. The exported runtime atlas passes the spill check with zero crossing parts, zero edge contact and no warnings. PNG alpha, outer frame clearance and six unique pose hashes are checked separately from anatomy and artistic quality. The skill's clip builder decodes and checks the WebP's timing and alpha and reports zero warnings.

The current runtime frame check has no failures and one `near_duplicates` warning: poses [0,1] meet its silhouette-IoU threshold of 0.95. Their pixel hashes are distinct. This finding is retained for review of the deliberately subtle breathing poses. Automated head-band matching was designed around a conventional body silhouette; on a horned quadruped its upper band may include the horns and storm-tail plume, so numerical identity results do not approve anatomy. The raw sheet, registered frames, light/dark/checker preview, planted paws, full horns/tail, mane drift, gold bands and blue energy pulse are reviewed separately.

## Every WARN or FAIL, verbatim

```json
'''
(OUT/'QA.md').write_text(text+json.dumps(findings,indent=2)+'\n```\n',encoding='utf-8')
runpy.run_path(str(ART/'package.py'))['archive']()
print(json.dumps({'qa':str(OUT/'QA.md'),'flaggedReports':len(findings)}))
