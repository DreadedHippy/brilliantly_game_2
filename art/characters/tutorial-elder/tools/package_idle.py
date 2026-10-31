"""Export generated, registered elder poses; no character art is drawn by this script."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

import numpy as np
from PIL import Image, ImageDraw

ART = Path(__file__).resolve().parents[1]
PROJECT = ART.parents[2]
OUTPUT = PROJECT / 'public/assets/sprites/tutorial-elder'


def load(path): return json.loads(path.read_text(encoding='utf-8'))
def save(path, value): path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def flagged_checks(value, location=''):
    if isinstance(value, dict):
        if str(value.get('status', '')).lower() in ('warn', 'fail') and 'id' in value:
            yield {'location': location, 'check': value}
        for name, child in value.items():
            yield from flagged_checks(child, f'{location}/{name}')
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from flagged_checks(child, f'{location}/{index}')


def archive():
    path = OUTPUT.parent / 'tutorial-elder-bundle.zip'
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
        for file in sorted(OUTPUT.rglob('*')):
            if file.is_file(): bundle.write(file, Path('tutorial-elder') / file.relative_to(OUTPUT))
    with zipfile.ZipFile(path) as bundle:
        if bundle.testzip() is not None: raise ValueError('ZIP CRC verification failed')
    print(json.dumps({'archive': str(path), 'bytes': path.stat().st_size, 'zipCRC': 'verified'}))


def main():
    if OUTPUT.exists(): raise ValueError(f'Refusing to overwrite {OUTPUT}')
    OUTPUT.mkdir(parents=True)
    for name in ('frames', 'source', 'prompts', 'qa'):
        (OUTPUT / name).mkdir()
    paths = sorted((ART / 'runtime-v2/frames').glob('*.png'))
    if len(paths) != 6: raise ValueError('Six generated poses are required')
    atlas = Image.new('RGBA', (1152, 768))
    strip = Image.new('RGBA', (2304, 384))
    contact = Image.new('RGB', (6 * 144, 185), '#202b47')
    labels = ImageDraw.Draw(contact)
    aseprite, hashes, boxes = [], [], []
    for index, path in enumerate(paths):
        with Image.open(path) as source: image = source.convert('RGBA')
        if image.size != (384, 384): raise ValueError('Shared 384px frame canvas required')
        pixels = np.asarray(image)
        alpha = pixels[..., 3]
        if not np.any(alpha == 0) or not np.any(alpha > 127): raise ValueError('Real alpha required')
        box = Image.fromarray((alpha > 16).astype('uint8') * 255).getbbox()
        if box is None or min(box[:2]) <= 0 or max(box[2:]) >= 384: raise ValueError('Sprite touches frame boundary')
        boxes.append(list(box))
        hashes.append(hashlib.sha256(image.tobytes()).hexdigest())
        x, y = (index % 3) * 384, (index // 3) * 384
        atlas.alpha_composite(image, (x, y))
        strip.alpha_composite(image, (index * 384, 0))
        filename = f'idle-{index:02d}.png'
        shutil.copy2(path, OUTPUT / 'frames' / filename)
        aseprite.append({'filename': filename, 'frame': {'x': x, 'y': y, 'w': 384, 'h': 384},
            'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': 384, 'h': 384},
            'sourceSize': {'w': 384, 'h': 384}, 'duration': 200})
        tile = Image.new('RGBA', (144, 144), '#202b47')
        tile.alpha_composite(image.resize((144, 144), Image.Resampling.LANCZOS))
        contact.paste(tile.convert('RGB'), (index * 144, 25))
        labels.text((index * 144 + 10, 8), f'Breath {index + 1}', fill='#f5edda')
    if len(set(hashes)) != len(hashes): raise ValueError('Exact duplicate source poses')
    atlas.save(OUTPUT / 'tutorial-elder.png', optimize=True)
    strip.save(OUTPUT / 'idle.png', optimize=True)
    contact.save(OUTPUT / 'contact-sheet.png', optimize=True)
    shutil.copy2(ART / 'master-v1/master_rgba.png', OUTPUT / 'master.png')
    shutil.copy2(next((ART / 'clips-v2/clips').glob('*.webp')), OUTPUT / 'idle.webp')
    sequence = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1]
    save(OUTPUT / 'tutorial-elder.json', {
        'schema': 'brilliantly.sprite.v1', 'name': 'tutorial-elder', 'artSource': 'host_image',
        'route': 'host-image_gen', 'model': None, 'estimateUsd': None,
        'image': 'tutorial-elder.png', 'frameWidth': 384, 'frameHeight': 384, 'columns': 3,
        'anchor': {'x': 192, 'y': 320}, 'facing': 'front-three-quarter', 'restBodyHeight': 256,
        'suggestedGameBodyHeight': 72,
        'reviewStatus': 'visual-review-with-advisory-near-duplicate-warning',
        'animations': {'idle': {'frames': sequence, 'uniquePoses': 6, 'frameRate': 5, 'ticksPerFrame': 12,
            'tickHz': 60, 'durationMs': 2000, 'repeat': -1, 'preview': 'idle.webp', 'sheet': 'idle.png'}},
        'limits': ['One seated camera view and idle action only.', 'Read QA.md for measured warnings and visual-review limits.'],
    })
    save(OUTPUT / 'tutorial-elder.aseprite.json', {'frames': aseprite, 'meta': {
        'app': 'Brilliantly sprite pipeline', 'version': '1', 'image': 'tutorial-elder.png',
        'format': 'RGBA8888', 'size': {'w': 1152, 'h': 768}, 'scale': '1',
        'frameTags': [{'name': 'idle', 'from': 0, 'to': 5, 'direction': 'pingpong'}]}})
    reports = [*sorted((ART / 'qa').glob('*/sheet-qc.json')), ART / 'master-v1/master.json',
        ART / 'processed-v2/animation.json', ART / 'runtime-v2/scale-frames.json', ART / 'clips-v2/animation-clips.json']
    flags, matte = [], None
    for path in reports:
        record = load(path)
        checks = list(flagged_checks(record))
        if checks: flags.append({'file': path.relative_to(PROJECT).as_posix(), 'checks': checks})
        shutil.copy2(path, OUTPUT / 'qa' / f'{path.parent.name}-{path.name}')
        if path.name == 'animation.json':
            with Image.open(ART / 'source/idle-generated.png') as source:
                raw = np.asarray(source.convert('RGBA'))
            matte = {'mode': 'native_alpha', 'keying': 'none',
                'alphaExtrema': [int(raw[..., 3].min()), int(raw[..., 3].max())],
                'transparentPixels': int(np.sum(raw[..., 3] == 0)),
                'visiblePixelsOver127': int(np.sum(raw[..., 3] > 127))}
    save(OUTPUT / 'qa-flags.json', {'flags': flags, 'matte': matte})
    save(OUTPUT / 'asset-checks.json', {'status': 'pass', 'uniquePoses': 6,
        'alphaBounds': boxes, 'pixelHashes': hashes, 'canvas': [384, 384],
        'notProven': ['Numeric checks do not prove anatomy, facial identity, or artistic motion quality.']})
    source_hashes = {}
    for name in ('master-generated.png', 'idle-generated.png', 'idle-prepared.png'):
        source = ART / 'source' / name
        shutil.copy2(source, OUTPUT / 'source' / name)
        source_hashes[name] = hashlib.sha256(source.read_bytes()).hexdigest()
    shutil.copy2(ART / 'source/preparation.json', OUTPUT / 'source/preparation.json')
    for path in ART.glob('*prompt.txt'): shutil.copy2(path, OUTPUT / 'prompts' / path.name)
    save(OUTPUT / 'provenance.json', {'art_source': 'host_image', 'route': 'host-image_gen',
        'model': None, 'estimateUsd': None, 'price': 'unknown; not returned by the built-in tool',
        'identityReference': 'User-attached elder NPC image in this conversation',
        'animationReference': 'master-v1/master_rgba.png', 'sourceHashes': source_hashes,
        'routeDecision': 'User previously selected frame-by-frame image-generated character sheets; retained for this NPC.',
        'finish': 'Native alpha preserved; ownership slicing, one shared scale, whole-frame root registration, and premultiplied downsampling.',
        'integration': 'Standalone asset preview; playable scenes have not been changed.'})
    note = 'The raw generated sheet had tight source-cell margins and faint alpha specks. Equal 128px transparent padding was added to every cell, and native-alpha hygiene removed floor haze and detached tiny specks without reposing or rescaling the character. Prepared-sheet QA is included alongside the historical raw-source findings. Numerical QA findings are included verbatim below. Subtle idle poses can produce near-duplicate silhouette warnings; distinct pixel hashes are checked separately. Any remaining FAIL is a review issue, not a production approval.'
    (OUTPUT / 'QA.md').write_text('# Tutorial elder idle QA\n\nBuilt-in image generation (`host-image_gen`), native transparency. Model and price were not returned.\n\nSix unique breathing poses play forward and backward without repeating the endpoints: ten playback steps, 5 fps, 2 seconds. Fixed 384×384 canvas, root [192,320], 256px rest-height; suggested in-game seated height 72px alongside the 96px standing hero.\n\n' + note + '\n\n## Every WARN and FAIL check\n\n```json\n' + json.dumps(flags, indent=2) + '\n```\n\n## Alpha processing\n\n```json\n' + json.dumps(matte, indent=2) + '\n```\n\nReview the loop over light, dark and checker backgrounds, especially the palm, beard, fringes, staff, stool and planted feet. One view and one idle action only. Numeric checks cannot approve artistic anatomy.\n', encoding='utf-8')
    template = (PROJECT / 'art/characters/main-hero/tools/preview.html').read_text(encoding='utf-8')
    template = template.replace('main-hero', 'tutorial-elder').replace('Main character', 'Tutorial mentor')
    template = re.sub(r'\s*<button type="button" data-action="(?:walk|run)"[^>]*>.*?</button>', '', template)
    template = template.replace('Afro, gold, beadwork, and woven cloth. Three motion loops from one character reference.', 'Silver curls, woven cloth, and a welcoming hand. A quiet seated breathing loop.')
    template = template.replace('96px body', '72px body').replace('width="144" height="144"', 'width="108" height="108"')
    template = template.replace('The canvas and foot position stay fixed across all three actions.', 'A fixed canvas and root keep the seated mentor anchored through the loop.')
    template = template.replace('Right-facing, smooth 2D sprite art. Frames were generated with the image tool, then keyed and registered. These are frame-by-frame sprite animations; no video-generation route was used.', 'Smooth 2D seated sprite art with genuine transparency. Six image-generated poses are registered and played as a slow breathing loop. No video-generation route was used.')
    template = template.replace('Draft for review: head-size variation and leg-alternation checks remain unresolved.', 'Review notes include every numerical QA warning and any remaining limitation.')
    (OUTPUT / 'preview.html').write_text(template, encoding='utf-8')
    (OUTPUT / 'README.txt').write_text('TUTORIAL ELDER — SEATED IDLE\n\nServe preview.html via Vite to view the breathing loop.\nAtlas tutorial-elder.png: 3 columns x 2 rows, each frame 384x384.\nIdle strip idle.png: 6 columns x 1 row, each frame 384x384.\nSequence: 0,1,2,3,4,5,4,3,2,1 at 5 fps (2-second loop).\nUse tutorial-elder.json with the atlas; Aseprite JSON is also included.\nRoot [192,320]. Suggested display scale 0.28125 for a 72px seated body.\nTransparent master, original sources, prompts and provenance are included.\nRead QA.md before production acceptance. No playable scenes were changed.\n', encoding='utf-8')
    print(json.dumps({'output': str(OUTPUT), 'uniquePoses': 6, 'playbackSteps': 10, 'qaFlags': len(flags)}))
    archive()


if __name__ == '__main__': main()
