"""Register a generated idle without altering anatomy or per-frame scale."""
from pathlib import Path
import sys, subprocess, json
from PIL import Image

ART=Path(__file__).resolve().parent
ROOT=ART.parents[2]
OUT=ROOT/'public/assets/sprites/bell-mask-enemy'
sys.path.insert(0,str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
from forge_core import alpha_hygiene

def forge(tool,*args,diagnostic=False):
    r=subprocess.run([sys.executable,str(ROOT/'art/characters/main-hero/tools/run_forge.py'),'generate2dsprite',tool,*map(str,args)],cwd=ROOT)
    if r.returncode and not diagnostic: raise SystemExit(r.returncode)

def main():
    forge('sheet_qc.py','spill','--input',ART/'source/idle-generated.png','--rows',2,'--cols',3,'--output-dir',ART/'qa/raw-sheet',diagnostic=True)
    forge('assemble_frames.py','--sheet',ART/'source/idle-generated.png','--rows',2,'--cols',3,'--key','none','--slice','ownership','--duration',200,'--output-dir',ART/'processed-v1')
    clean=ART/'clean-v1'; clean.mkdir(exist_ok=False)
    reports=[]
    for source in sorted((ART/'processed-v1/frames').glob('*.png')):
        image,report=alpha_hygiene(Image.open(source).convert('RGBA'),mode='floor')
        image.save(clean/source.name); reports.append({'frame':source.name,'alphaHygiene':report})
    (clean/'alpha-cleanup.json').write_text(json.dumps(reports,indent=2)+'\n',encoding='utf-8')
    forge('scale_frames.py','--frames',*sorted(clean.glob('*.png')),'--frames-per-row',3,'--neutral',0,'--target-body-px',256,'--canvas','512,384','--anchor-px','256,320','--anchor','bbox','--root-lock','torso-x','--lock','feet','--alpha-threshold',127,'--resampler','box','--output-dir',ART/'runtime-v1')
    subprocess.run([sys.executable,str(ART/'package.py')],cwd=ROOT,check=True)
    forge('build_animation_clips.py','--manifest',OUT/'clips.json','--preview-scale',1,'--output-dir',ART/'clips-v1')
    forge('sheet_qc.py','frames','--frames',*sorted((OUT/'frames').glob('*.png')),'--frames-per-row',3,'--cycle','none','--facing','left','--no-loop','--game-pixel',256/96,'--output-dir',ART/'qa/runtime-frames',diagnostic=True)
    forge('sheet_qc.py','spill','--input',OUT/'bell-mask-enemy.png','--rows',2,'--cols',3,'--output-dir',ART/'qa/runtime-atlas',diagnostic=True)
    subprocess.run([sys.executable,str(ART/'finish.py')],cwd=ROOT,check=True)

if __name__=='__main__': main()
