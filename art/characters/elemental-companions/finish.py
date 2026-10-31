"""Preserve exact diagnostic reports and package verified animated WebP previews."""
from pathlib import Path
import sys, json, shutil, runpy
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]

def flags(value):
    result=[]
    if isinstance(value,dict):
        if value.get('status') in ('warn','fail') and 'id' in value: result.append(value)
        for child in value.values(): result.extend(flags(child))
    elif isinstance(value,list):
        for child in value: result.extend(flags(child))
    return result

def main(slug):
    art=ROOT/'art/characters'/slug
    out=ROOT/'public/assets/sprites'/slug
    plan=json.loads((art/'asset-plan.json').read_text(encoding='utf-8'))
    version=max(v for v in (1,2,3) if (art/f'runtime-v{v}').exists())
    runtime=f'runtime-v{version}'
    clips=f'clips-v{version}'
    reports=[art/'master-v1/master.json',*sorted(art.glob('processed-v*/animation.json')),art/runtime/'scale-frames.json',art/clips/'animation-clips.json',*sorted((art/'qa').glob('*/sheet-qc.json'))]
    findings=[]
    for path in reports:
        data=json.loads(path.read_text(encoding='utf-8'))
        checks=flags(data)
        shutil.copy2(path,out/'qa'/f'{path.parent.name}-{path.name}')
        if checks: findings.append({'file':path.relative_to(ROOT).as_posix(),'checks':checks})
    shutil.copy2(next((art/clips/'clips').glob('*.webp')),out/'idle.webp')
    with Image.open(out/'idle.webp') as im:
        durations=[]
        for i in range(im.n_frames):
            im.seek(i); im.load(); durations.append(im.info.get('duration'))
        assert len(durations)==10 and durations==[200]*10, durations
    (out/'qa-flags.json').write_text(json.dumps(findings,indent=2)+'\n',encoding='utf-8')
    active=[]
    for item in findings:
        parent=Path(item['file']).parent.name
        if parent in {f'runtime-frames-v{version}',f'runtime-atlas-v{version}'} or (version==1 and parent in {'runtime-frames','runtime-atlas'}): active.append(item)
    text=f'''# {plan['workingLabel']} idle QA

Generated with built-in `host-image_gen` from the matching user reference, then from its accepted transparent master. Model and cost were not returned. The previously selected image-generated frame-by-frame route is retained.

{plan['motion']} Six genuine drawn poses play forward/back as ten steps at 5fps, exactly 2 seconds, with no doubled endpoint. The WebP was decoded to verify ten 200ms frames. Each runtime frame is 512×384 on a shared [256,320] root and one scale; the 256px rest height includes the complete silhouette and effects. Suggested game silhouette height is 80px. This is one right-facing idle view, delivered as an asset and preview.

Native alpha is retained, with only near-transparent alpha-floor noise cleared. Component-ownership slicing recovers overhangs rather than cutting at nominal grid lines. No largest-component filtering, limb manipulation or per-frame resizing is used. The owl uses one translation per source row to remove the source's row-placement jump, retaining within-row airborne motion and wing flex without foot locks. PNG alpha, frame-border clearance and six unique pixel hashes are checked independently of visual anatomy. Raw-sheet layout flags describe the source, not automatically the exported atlas. Active registration: `{runtime}`; active clips: `{clips}`. The highest-numbered runtime-frames and runtime-atlas reports describe the current export; earlier reports are retained as historical diagnostics of superseded takes or registration. A face-review report uses a fixed facial crop for analysis only, rather than changing runtime art; that crop also contains adjacent ornaments and feathers and is not proof of anatomical identity. Read every flag below before acceptance.

Automated silhouette and upper-band identity diagnostics do not approve anatomy or elemental effects. Similar silhouettes may reflect subtle breathing; head-band measurements may include a tree, tall mane, wings or wind ribbons. Visual review of identity, extremities, planted feet or hovering wings, and light/dark transparency accompanies numerical QA. The owl's targeted facial-consistency edit does not clear its default upper-band identity check; the remaining flag and measured torso drift are retained below rather than declaring the art QA fully passed.

## Current export findings

```json
{json.dumps(active,indent=2)}
```

## Every WARN or FAIL, verbatim

```json
'''
    (out/'QA.md').write_text(text+json.dumps(findings,indent=2)+'\n```\n',encoding='utf-8')
    runpy.run_path(str(art/'package.py'))['archive']()
    print(json.dumps({'id':slug,'flaggedReports':len(findings),'webpFrames':10,'durationMs':2000}))

if __name__=='__main__': main(sys.argv[1])
