"""Collect source, provenance, exact QA flags, and the runnable preview into the asset bundle."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile

ART = Path(__file__).resolve().parents[1]
PROJECT = ART.parents[2]
STAGE = ART / 'export-bundle-v2'
PUBLIC = PROJECT / 'public/assets/sprites/main-hero'


def load(path): return json.loads(path.read_text(encoding='utf-8'))
def save(path, data): path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def main():
    subprocess.run([sys.executable, str(ART / 'tools/package_assets.py'), '--output-dir', str(STAGE)], cwd=PROJECT, check=True)
    shutil.copy2(ART / 'tools/preview.html', STAGE / 'preview.html')
    for folder in ('prompts', 'source', 'qa'):
        (STAGE / folder).mkdir()
    for prompt in ART.glob('*prompt.txt'):
        shutil.copy2(prompt, STAGE / 'prompts' / prompt.name)
    selected_sources = ['main-hero-generated.png', 'idle-take-1.png', 'walk-take-3.png', 'run-take-1.png']
    for name in selected_sources:
        shutil.copy2(ART / 'source' / name, STAGE / 'source' / name)
    selected_qa = {
        'idle': ART / 'qa/idle-final-frames/sheet-qc.json',
        'walk': ART / 'qa/walk-final-frames/sheet-qc.json',
        'run': ART / 'qa/run-runtime-frames/sheet-qc.json',
    }
    all_flags, current_flags, key_metrics = [], {}, {}
    for path in sorted((ART / 'qa').glob('*/sheet-qc.json')):
        report = load(path)
        flags = [item for item in report.get('checks', []) if item.get('status') in ('warn', 'fail')]
        relative = path.relative_to(PROJECT).as_posix()
        if flags:
            all_flags.append({'file': relative, 'checks': flags})
        shutil.copy2(path, STAGE / 'qa' / f'{path.parent.name}.json')
    for action, path in selected_qa.items():
        current_flags[action] = [item for item in load(path)['checks'] if item.get('status') in ('warn', 'fail')]
        sliced = 'walk-sliced-v2' if action == 'walk' else f'{action}-sliced-v1'
        source = load(ART / f'processed/{sliced}/animation.json')
        key_metrics[action] = source['sources'][0]['key']['qa']
    save(STAGE / 'qa-flags.json', {'selectedActions': current_flags, 'allPublishedChecks': all_flags, 'matte': key_metrics})
    save(STAGE / 'provenance.json', {
        'art_source': 'host_image', 'route': 'host-image_gen', 'model': None,
        'estimateUsd': None, 'price': 'unknown; the built-in tool did not return a cost',
        'reference': 'User-supplied character image in this conversation',
        'animationRouteDecision': 'User explicitly chose image-generated frame-by-frame sheets instead of the unavailable video route.',
        'selectedSources': {name: hashlib.sha256((STAGE / 'source' / name).read_bytes()).hexdigest() for name in selected_sources},
        'processing': 'Soft chroma key; component-ownership slicing preserves crossing toes; one shared 0.5389473684210526 source-to-runtime scale; fixed 384x384 canvas and [192,320] root; grounded walk foot lock, run flight retained.',
        'idle': 'Four drawn breathing poses played 0,1,2,3,2,1, avoiding the less consistent second source-sheet row.',
        'integration': 'Asset generation and standalone preview only; existing game character wiring is unchanged.',
    })
    lines = [
        '# Main hero asset QA', '',
        'Generated with the built-in image tool (`host-image_gen`). Model and cost were not returned; price unknown. The user approved frame-by-frame image sheets as the animation route.', '',
        'The bundle contains a transparent master, 20 unique runtime PNG poses, a 3072×1152 atlas, per-action sheets, Aseprite metadata, three animated WebP previews, source images and prompts. Idle uses four unique poses in a six-step breathing loop; walk and run each use eight unique poses. The common canvas is 384×384, root [192, 320], with 256px rest body height (suggested game display: 96px).', '',
        '## Review status', '',
        'These are generated draft animations with unresolved motion heuristics, not a claim that every art check passed. Head/afro scale varies slightly; automatic luminance-based leg-depth checks still flag uncertain or repeated leads. Inspect those before production acceptance. Both trouser legs share cloth colours, which also limits the automatic depth classifier. Source-sheet boundary crossings were recovered with component ownership instead of clipping feet. Walk contact positions were grounded during registration. Run flight was retained. Idle was reduced to the more consistent first four breathing poses.', '',
        'The alpha, atlas bounds, unique-pose counts, decoded preview timing, byte-copy checks and runtime metadata were checked separately. No code-drawn character animation or generated video was substituted.', '',
        '## Selected-action WARN and FAIL checks', '',
    ]
    for action, flags in current_flags.items():
        lines += [f'### {action}', '', f'Source: `{selected_qa[action].relative_to(PROJECT).as_posix()}`', '', '```json', json.dumps(flags, indent=2), '```', '']
    lines += ['## Matte measurements', '', 'Measured on keyed source sheets; these do not prove anatomy or motion quality.', '', '```json', json.dumps(key_metrics, indent=2), '```', '', '## Every archived WARN and FAIL check', '', 'Earlier takes and source-sheet checks are retained verbatim below, including superseded failures. Current-action findings above identify the selected export.', '', '```json', json.dumps(all_flags, indent=2), '```', '']
    (STAGE / 'QA.md').write_text('\n'.join(lines), encoding='utf-8')
    # Replace only this task's draft export, retaining its complete previous version.
    if not PUBLIC.resolve().is_relative_to(PROJECT):
        raise ValueError('Public bundle escaped the project')
    backup = ART / 'export-bundle-v1-backup'
    if PUBLIC.exists():
        shutil.copytree(PUBLIC, backup)
        shutil.rmtree(PUBLIC)
    try:
        shutil.copytree(STAGE, PUBLIC)
    except BaseException:
        if PUBLIC.exists(): shutil.rmtree(PUBLIC)
        if backup.exists(): shutil.copytree(backup, PUBLIC)
        raise
    archive = PUBLIC.parent / 'main-hero-bundle.zip'
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(PUBLIC.rglob('*')):
            if path.is_file(): bundle.write(path, Path('main-hero') / path.relative_to(PUBLIC))
    print(json.dumps({'bundle': str(PUBLIC), 'archive': str(archive), 'motionFlags': {action: [item['id'] for item in flags] for action, flags in current_flags.items()}}))


if __name__ == '__main__': main()
