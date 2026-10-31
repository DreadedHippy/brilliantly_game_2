"""Run installed Forge tools with explicit output folders and preserve every QA report."""
from pathlib import Path
import sys, subprocess

ROOT=Path(__file__).resolve().parents[3]
WRAPPER=ROOT/'art/characters/main-hero/tools/run_forge.py'

def main(slug):
    art=Path('art/characters')/slug
    public=Path('public/assets/sprites')/slug
    def forge(tool,*args,diagnostic=False):
        result=subprocess.run([sys.executable,str(WRAPPER),'generate2dsprite',tool,*map(str,args)],cwd=ROOT)
        if result.returncode and not diagnostic: raise SystemExit(result.returncode)
    forge('sheet_qc.py','spill','--input',art/'source/idle-generated.png','--rows',2,'--cols',3,'--output-dir',art/'qa/raw-sheet',diagnostic=True)
    forge('assemble_frames.py','--sheet',art/'source/idle-generated.png','--rows',2,'--cols',3,'--key','none','--slice','ownership','--duration',200,'--output-dir',art/'processed-v1')
    frames=sorted((ROOT/art/'processed-v1/frames').glob('*.png'))
    locks=['--anchor','bbox','--root-lock','none'] if slug=='wind-owl' else ['--anchor','stance','--root-lock','stance','--lock','feet']
    forge('scale_frames.py','--frames',*frames,'--frames-per-row',3,'--neutral',0,'--target-body-px',256,'--canvas','512,384','--anchor-px','256,320',*locks,'--alpha-threshold',127,'--resampler','box','--output-dir',art/'runtime-v1')
    subprocess.run([sys.executable,str(ROOT/art/'package.py')],cwd=ROOT,check=True)
    forge('build_animation_clips.py','--manifest',public/'clips.json','--preview-scale',1,'--output-dir',art/'clips-v1')
    runtime_frames=sorted((ROOT/public/'frames').glob('*.png'))
    forge('sheet_qc.py','frames','--frames',*runtime_frames,'--frames-per-row',3,'--cycle','none','--facing','right','--no-loop','--game-pixel',3.2,'--output-dir',art/'qa/runtime-frames',diagnostic=True)
    forge('sheet_qc.py','spill','--input',public/f'{slug}.png','--rows',2,'--cols',3,'--output-dir',art/'qa/runtime-atlas',diagnostic=True)
    subprocess.run([sys.executable,str(Path(__file__).with_name('finish.py')),slug],cwd=ROOT,check=True)

if __name__=='__main__': main(sys.argv[1])
