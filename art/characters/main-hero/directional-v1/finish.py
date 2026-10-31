"""Collect clip previews, original and head-only diagnostics, prompts and the versioned export."""
from pathlib import Path
import json
import shutil
import zipfile

ART = Path(__file__).resolve().parent
PROJECT = ART.parents[3]
OUT = PROJECT / 'public/assets/sprites/main-hero/directions'

def flags(value):
    result=[]
    if isinstance(value,dict):
        if value.get('status') in ('warn','fail') and 'id' in value: result.append(value)
        for child in value.values(): result.extend(flags(child))
    elif isinstance(value,list):
        for child in value: result.extend(flags(child))
    return result

qa_dir=OUT/'qa'; qa_dir.mkdir(exist_ok=True)
reports=[]; selected={}
for direction in ('down','up'):
    for label,path in [('default',ART/f'qa/{direction}/sheet-qc.json'),('head-only',ART/f'qa/{direction}-head-only/sheet-qc.json'),('slice',ART/f'{direction}-sliced/animation.json'),('clips',ART/f'{direction}-clips/animation-clips.json')]:
        data=json.loads(path.read_text(encoding='utf-8'))
        shutil.copy2(path,qa_dir/f'{direction}-{label}.json')
        checks=flags(data)
        if checks: reports.append({'file':path.relative_to(PROJECT).as_posix(),'checks':checks})
        if label=='head-only': selected[direction]={'status':data['status'],'headBandFraction':0.23 if direction=='down' else 0.18,'checks':data['checks']}
    shutil.copy2(next((ART/f'{direction}-clips/clips').glob('*00.webp')),OUT/f'walk-{direction}.webp')
text='''# Directional hero walking QA

Two new image-generated views use the existing accepted hero master: front/down and back/up. Each has eight distinct walk poses and one neutral standing pose. Runtime sheets are 3×3 at 384px per frame, with one [192,320] root and one shared 0.6432160804020101 source-to-runtime scale across both views. In-game body height remains 96px. Native-alpha speck cleanup removes only tiny alpha noise; figures are not resized per frame.

Walking uses 7 ticks per pose at 60Hz, about 8.57fps. Vertical running reuses the same walking poses at 15fps; it is not claimed as a separately generated run cycle. Stopping retains the current facing using the ninth neutral pose. The older side-facing hero bundle is unchanged.

## Measurements and interpretation

The default identity check samples the upper 35% of the body, which includes moving chest/arms in these front/back views. It flagged a 0.94 head-template ratio in down frame 7 and up frame 4, outside its [0.95,1.05] interval. Those original FAIL records are retained verbatim below.

The head-only check was also run with a front head band of 23% and a rear head band of 18%, based on the visible head boundaries in the source and registered sheets. The original ±5% threshold was retained. Both head-only reports pass, without warnings. This distinguishes head matching from upper-body pose matching; it does not prove anatomical or gait quality or erase the broader diagnostics. The side-view leg classifier was not applied to front/back views. All poses, visible extremities, sword handedness, common scale, alpha on light/dark, and playback are visually reviewed separately.

The clip builder reports zero timing or alpha warnings for both directions. Frame transparency, frame bounds, nine unique pixel hashes per direction, and the 18-pose combined preview were checked. Complete reports are under `qa/`; prompts and original generated sheets are included.

Art route: built-in `host-image_gen`, using the user's previously selected frame-by-frame route. Model and cost were not returned. No video or code-drawn character art was substituted.

## Every WARN or FAIL, verbatim

```json
'''
(OUT/'QA.md').write_text(text+json.dumps(reports,indent=2)+'\n```\n',encoding='utf-8')
(OUT/'qa-flags.json').write_text(json.dumps({'diagnostics':reports,'selectedHeadMeasurements':selected},indent=2)+'\n',encoding='utf-8')
archive=OUT.parent.parent/'main-hero-directions.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as bundle:
    for file in sorted(OUT.rglob('*')):
        if file.is_file(): bundle.write(file,Path('main-hero-directions')/file.relative_to(OUT))
with zipfile.ZipFile(archive) as bundle:
    if bundle.testzip() is not None: raise ValueError('Directional ZIP integrity failure')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'qaReports':len(reports),'selectedChecks':{k:v['status'] for k,v in selected.items()}}))
