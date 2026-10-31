"""Clean alpha specks and pad every cell equally; preserve all character geometry and scale."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

ART = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / '.codex/skills/generate2dsprite/scripts'))
from forge_core import alpha_hygiene

source_path = ART / 'source/idle-generated.png'
destination = ART / 'source/idle-prepared.png'
if destination.exists(): raise ValueError('Prepared source already exists')
with Image.open(source_path) as source:
    source = source.convert('RGBA')
    width, height = source.width // 3, source.height // 2
    if source.size != (width * 3, height * 2): raise ValueError('Non-integral source grid')
    padding = 128
    prepared = Image.new('RGBA', ((width + padding * 2) * 3, (height + padding * 2) * 2))
    metrics = []
    for index in range(6):
        column, row = index % 3, index // 3
        tile = source.crop((column * width, row * height, (column + 1) * width, (row + 1) * height))
        pixels, result = alpha_hygiene(np.asarray(tile), mode='both')
        prepared.paste(pixels,
            (column * (width + padding * 2) + padding, row * (height + padding * 2) + padding))
        metrics.append(result)
prepared.save(destination, optimize=True)
(ART / 'source/preparation.json').write_text(json.dumps({
    'source': source_path.name, 'output': destination.name, 'sourceSize': list(source.size),
    'outputSize': list(prepared.size), 'cellPadding': padding, 'scale': 1,
    'operation': 'Native-alpha hygiene both, then equal transparent padding per cell. No rescaling, limb manipulation, or per-frame crops.',
    'hygiene': metrics,
}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'prepared': str(destination), 'size': list(prepared.size), 'hygiene': metrics}))
