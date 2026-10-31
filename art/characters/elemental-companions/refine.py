"""Refine horizontal registration without changing anatomy or per-frame scale."""
from pathlib import Path
import sys, subprocess, shutil
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
def main(slug):
    art=ROOT/'art/characters'/slug
    public=ROOT/'public/assets/sprites'/slug
    def forge(tool,*args,diagnostic=False):
        r=subprocess.run([sys.executable,str(ROOT/'art/characters/main-hero/tools/run_forge.py'),'generate2dsprite',tool,*map(str,args)],cwd=ROOT)
        if r.returncode and not diagnostic: raise SystemExit(r.returncode)
    if not (art/'clean-v1').exists():
        sys.path.insert(0,str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
        from forge_core import alpha_hygiene
        (art/'clean-v1').mkdir()
        for source in sorted((art/'processed-v1/frames').glob('*.png')):
            image,_=alpha_hygiene(Image.open(source).convert('RGBA'),mode='floor')
            image.save(art/'clean-v1'/source.name)
    frames=sorted((art/'clean-v1').glob('frame-*.png'))
    locks=['--row-baseline'] if slug=='wind-owl' else ['--lock','feet']
    forge('scale_frames.py','--frames',*frames,'--frames-per-row',3,'--neutral',0,'--target-body-px',256,'--canvas','512,384','--anchor-px','256,320','--anchor','bbox','--root-lock','torso-x',*locks,'--alpha-threshold',127,'--resampler','box','--output-dir',art/'runtime-v2')
    old=art/'review-v1'
    if old.exists() or not public.is_relative_to(ROOT) or not old.is_relative_to(ROOT): raise ValueError('Unsafe or existing review destination')
    shutil.move(str(public),str(old))
    package=art/'package.py'
    package.write_text(package.read_text(encoding='utf-8').replace('runtime-v1/frames','runtime-v2/frames'),encoding='utf-8')
    subprocess.run([sys.executable,str(package)],cwd=ROOT,check=True)
    forge('build_animation_clips.py','--manifest',public/'clips.json','--preview-scale',1,'--output-dir',art/'clips-v2')
    frames=sorted((public/'frames').glob('*.png'))
    forge('sheet_qc.py','frames','--frames',*frames,'--frames-per-row',3,'--cycle','none','--facing','right','--no-loop','--game-pixel',3.2,'--output-dir',art/'qa/runtime-frames-v2',diagnostic=True)
    forge('sheet_qc.py','spill','--input',public/f'{slug}.png','--rows',2,'--cols',3,'--output-dir',art/'qa/runtime-atlas-v2',diagnostic=True)
    subprocess.run([sys.executable,str(Path(__file__).with_name('finish.py')),slug],cwd=ROOT,check=True)

if __name__=='__main__': main(sys.argv[1])
