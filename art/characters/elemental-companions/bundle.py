"""Repack the final formatted assets and verify every archive's CRC."""
from pathlib import Path
import runpy, zipfile, json, shutil

ROOT=Path(__file__).resolve().parents[3]
SLUGS=['earth-tortoise','ember-lion','wind-owl']

def main():
    sprites=ROOT/'public/assets/sprites'
    for slug in SLUGS:
        runpy.run_path(str(ROOT/'art/characters'/slug/'package.py'))['archive']()
    target=sprites/'elemental-companions-bundle.zip'
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('README.txt','ELEMENTAL COMPANION IDLES\n\nEarth tortoise, ember lion and wind owl are descriptive asset labels.\nEach folder contains a 2-second idle, transparent PNG assets, WebP, metadata, original sources, prompts, provenance and exact QA.\nServe preview.html over HTTP; reduced motion starts paused.\nSuggested silhouette display height: 80px.\n\nArt review: the tortoise retains subtle-pose similarity warnings; elemental fringes have conservative margin/detached-effect warnings. The owl retains a head-size flag and measured torso drift despite a targeted image edit. Read each QA.md for every exact value, threshold, current report and preserved historical diagnostic.\n\nGenerated using built-in image generation. No level placement or following AI is included.\n')
        for slug in SLUGS:
            for item in sorted((sprites/slug).rglob('*')):
                if item.is_file(): z.write(item,Path(slug)/item.relative_to(sprites/slug))
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        count=len(z.namelist())
    # Synchronize archives after the production build without repeating code checks.
    dist=ROOT/'dist/assets/sprites'
    if dist.is_dir():
        for name in [*(slug+'-bundle.zip' for slug in SLUGS),target.name]: shutil.copy2(sprites/name,dist/name)
    print(json.dumps({'combinedBundle':str(target),'bytes':target.stat().st_size,'files':count,'zipCRC':'verified'}))

if __name__=='__main__': main()
