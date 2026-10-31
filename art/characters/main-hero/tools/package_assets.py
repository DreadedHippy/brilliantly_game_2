"""Package reviewed generated hero frames for Phaser and Aseprite without reposing art."""

from pathlib import Path
import argparse
import hashlib
import json
import shutil

import numpy as np
from PIL import Image, ImageDraw

PROJECT = Path(__file__).resolve().parents[4]
ART = PROJECT / 'art/characters/main-hero'
OUTPUT = PROJECT / 'public/assets/sprites/main-hero'
ACTIONS = {'idle': 12, 'walk': 7, 'run': 4}
RUNTIME_VERSIONS = {'idle': 'v2', 'walk': 'v3', 'run': 'v2'}
CLIP_VERSIONS = {'idle': 'v2', 'walk': 'v4', 'run': 'v2'}


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def save(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def main():
    global OUTPUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path)
    args = parser.parse_args()
    if args.output_dir:
        OUTPUT = args.output_dir.resolve()
        if not OUTPUT.is_relative_to(PROJECT):
            raise ValueError('Output must stay inside the project')
    if OUTPUT.exists():
        raise SystemExit(f'Refusing to overwrite an existing bundle: {OUTPUT}')
    OUTPUT.mkdir(parents=True)
    atlas = Image.new('RGBA', (384 * 8, 384 * 3))
    clips, aseprite_frames, tags, metrics = {}, [], [], {}
    review = Image.new('RGB', (8 * 144, 3 * 190), '#202b47')
    label = ImageDraw.Draw(review)
    frame_index = 0
    for row, (action, ticks) in enumerate(ACTIONS.items()):
        count = 4 if action == 'idle' else 8
        strip = Image.new('RGBA', (384 * count, 384))
        frames = sorted((ART / f'runtime/{action}-{RUNTIME_VERSIONS[action]}/frames').glob('*.png'))
        if len(frames) != count:
            raise ValueError(f'{action}: expected {count} actual frames, got {len(frames)}')
        alpha_boxes, digests = [], []
        for column, path in enumerate(frames):
            with Image.open(path) as source:
                image = source.convert('RGBA')
            if image.size != (384, 384):
                raise ValueError(f'{action}: incompatible frame canvas')
            pixels = np.asarray(image)
            alpha = pixels[..., 3]
            if not np.any(alpha == 0) or not np.any(alpha > 127):
                raise ValueError(f'{path.name}: missing transparency or visible subject')
            box = Image.fromarray((alpha > 16).astype('uint8') * 255).getbbox()
            if box is None or box[0] <= 0 or box[1] <= 0 or box[2] >= 384 or box[3] >= 384:
                raise ValueError(f'{action}: subject touches runtime frame boundary')
            digest = hashlib.sha256(image.tobytes()).hexdigest()
            digests.append(digest)
            alpha_boxes.append(list(box))
            x, y = column * 384, row * 384
            atlas.alpha_composite(image, (x, y))
            strip.alpha_composite(image, (x, 0))
            filename = f'{action}-{column:02d}.png'
            frame_path = OUTPUT / 'frames' / filename
            frame_path.parent.mkdir(exist_ok=True)
            shutil.copy2(path, frame_path)
            aseprite_frames.append({
                'filename': filename, 'frame': {'x': x, 'y': y, 'w': 384, 'h': 384},
                'rotated': False, 'trimmed': False,
                'spriteSourceSize': {'x': 0, 'y': 0, 'w': 384, 'h': 384},
                'sourceSize': {'w': 384, 'h': 384},
                'duration': round((column + 1) * ticks * 1000 / 60) - round(column * ticks * 1000 / 60),
            })
            # Each preview is rebuilt from the full transparent frame, not its own bbox.
            small = image.resize((144, 144), Image.Resampling.LANCZOS)
            tile = Image.new('RGBA', (144, 144), '#202b47')
            tile.alpha_composite(small)
            review.paste(tile.convert('RGB'), (column * 144, row * 190 + 25))
            label.text((column * 144 + 8, row * 190 + 8), f'{action} {column + 1}', fill='#f5edda')
        if len(set(digests)) != count:
            raise ValueError(f'{action}: duplicated frames cannot fill an animation')
        order = [0, 1, 2, 3, 2, 1] if action == 'idle' else list(range(count))
        clips[action] = {
            'frames': [row * 8 + index for index in order],
            'uniquePoses': count,
            'frameRate': 60 / ticks, 'ticksPerFrame': ticks, 'tickHz': 60,
            'durationMs': len(order) * ticks * 1000 / 60, 'repeat': -1,
            'preview': f'{action}.webp',
            'sheet': f'{action}.png',
        }
        strip.save(OUTPUT / f'{action}.png', optimize=True)
        tags.append({'name': action, 'from': frame_index, 'to': frame_index + count - 1, 'direction': 'pingpong' if action == 'idle' else 'forward'})
        metrics[action] = {'uniqueFrames': count, 'canvas': [384, 384], 'alphaBounds': alpha_boxes, 'pixelHashes': digests}
        clip_version = CLIP_VERSIONS[action]
        preview = next((ART / f'clips/{action}-{clip_version}/clips').glob('*.webp'))
        shutil.copy2(preview, OUTPUT / f'{action}.webp')
        frame_index += count
    atlas.save(OUTPUT / 'main-hero.png', optimize=True)
    shutil.copy2(ART / 'master-v1/master_rgba.png', OUTPUT / 'master.png')
    review.save(OUTPUT / 'contact-sheet.png', optimize=True)
    save(OUTPUT / 'main-hero.json', {
        'schema': 'brilliantly.sprite.v1', 'name': 'main-hero', 'artSource': 'host_image',
        'route': 'host-image_gen', 'model': None, 'estimateUsd': None,
        'generationMethod': 'Image-generated frame-by-frame sheets, selected explicitly by the user',
        'image': 'main-hero.png', 'frameWidth': 384, 'frameHeight': 384, 'columns': 8,
        'anchor': {'x': 192, 'y': 320}, 'facing': 'right',
        'restBodyHeight': 256, 'suggestedGameBodyHeight': 96,
        'animations': clips,
        'reviewStatus': 'draft-with-motion-QA-flags',
        'limits': ['Single right-facing view; no front/back directional set.', 'Head-ratio and leg-alternation heuristic flags remain; read QA.md before production acceptance.'],
    })
    save(OUTPUT / 'main-hero.aseprite.json', {
        'frames': aseprite_frames,
        'meta': {'app': 'Brilliantly sprite pipeline', 'version': '1', 'image': 'main-hero.png',
                 'format': 'RGBA8888', 'size': {'w': atlas.width, 'h': atlas.height},
                 'scale': '1', 'frameTags': tags},
    })
    save(OUTPUT / 'asset-checks.json', {'status': 'pass', 'checks': metrics,
        'notProven': ['Biomechanics, exact identity and artistic loop quality are visually reviewed, not proven by these checks.']})
    print(json.dumps({'output': str(OUTPUT), 'frames': frame_index, 'actions': list(clips), 'atlasSize': list(atlas.size)}))


if __name__ == '__main__':
    main()
