"""Remove alpha-floor noise before sizing; preserve all visible elemental fringes."""
from pathlib import Path
import sys, json, subprocess, importlib.util
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
from forge_core import alpha_hygiene

def main(slug):
    art=Path('art/characters')/slug
    clean=ROOT/art/'clean-v1'
    clean.mkdir(exist_ok=False)
    paths=[]; measures=[]
    for source in sorted((ROOT/art/'processed-v1/frames').glob('*.png')):
        image,report=alpha_hygiene(Image.open(source).convert('RGBA'),mode='floor')
        target=clean/source.name; image.save(target)
        paths.append(target); measures.append({'frame':source.name,'hygiene':report})
    (clean/'alpha-cleanup.json').write_text(json.dumps(measures,indent=2)+'\n',encoding='utf-8')
    def forge(tool,*args,diagnostic=False):
        r=subprocess.run([sys.executable,str(ROOT/'art/characters/main-hero/tools/run_forge.py'),'generate2dsprite',tool,*map(str,args)],cwd=ROOT)
        if r.returncode and not diagnostic: raise SystemExit(r.returncode)
    locks=['--row-baseline'] if slug=='wind-owl' else ['--root-lock','stance','--lock','feet']
    forge('scale_frames.py','--frames',*paths,'--frames-per-row',3,'--neutral',0,'--target-body-px',256,'--canvas','512,384','--anchor-px','256,320','--anchor','bbox',*locks,'--alpha-threshold',127,'--resampler','box','--output-dir',art/'runtime-v1')
    subprocess.run([sys.executable,str(ROOT/art/'package.py')],cwd=ROOT,check=True)
    public=Path('public/assets/sprites')/slug
    forge('build_animation_clips.py','--manifest',public/'clips.json','--preview-scale',1,'--output-dir',art/'clips-v1')
    frames=sorted((ROOT/public/'frames').glob('*.png'))
    forge('sheet_qc.py','frames','--frames',*frames,'--frames-per-row',3,'--cycle','none','--facing','right','--no-loop','--game-pixel',3.2,'--output-dir',art/'qa/runtime-frames',diagnostic=True)
    forge('sheet_qc.py','spill','--input',public/f'{slug}.png','--rows',2,'--cols',3,'--output-dir',art/'qa/runtime-atlas',diagnostic=True)
    subprocess.run([sys.executable,str(Path(__file__).with_name('finish.py')),slug],cwd=ROOT,check=True)

if __name__=='__main__': main(sys.argv[1])
