"""Process the facial-consistency edit while retaining earlier source takes and diagnostics."""
from pathlib import Path
import sys, subprocess, shutil, json, hashlib
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'art/characters/wind-owl'
OUT=ROOT/'public/assets/sprites/wind-owl'
sys.path.insert(0,str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
from forge_core import alpha_hygiene

def forge(tool,*args,diagnostic=False):
    r=subprocess.run([sys.executable,str(ROOT/'art/characters/main-hero/tools/run_forge.py'),'generate2dsprite',tool,*map(str,args)],cwd=ROOT)
    if r.returncode and not diagnostic: raise SystemExit(r.returncode)

def main():
    source=ART/'source/idle-corrected.png'
    forge('sheet_qc.py','spill','--input',source,'--rows',2,'--cols',3,'--output-dir',ART/'qa/corrected-raw-sheet',diagnostic=True)
    forge('assemble_frames.py','--sheet',source,'--rows',2,'--cols',3,'--key','none','--slice','ownership','--duration',200,'--output-dir',ART/'processed-v2')
    clean=ART/'clean-v2'; clean.mkdir(exist_ok=False)
    for p in sorted((ART/'processed-v2/frames').glob('*.png')):
        image,_=alpha_hygiene(Image.open(p).convert('RGBA'),mode='floor')
        image.save(clean/p.name)
    forge('scale_frames.py','--frames',*sorted(clean.glob('*.png')),'--frames-per-row',3,'--neutral',0,'--target-body-px',256,'--canvas','512,384','--anchor-px','256,320','--anchor','bbox','--root-lock','torso-x','--row-baseline','--alpha-threshold',127,'--resampler','box','--output-dir',ART/'runtime-v3')
    old=ART/'review-v2'
    if old.exists() or not OUT.is_relative_to(ROOT) or not old.is_relative_to(ROOT): raise ValueError('Unsafe or existing review destination')
    shutil.move(str(OUT),str(old))
    package=ART/'package.py'
    package.write_text(package.read_text(encoding='utf-8').replace('runtime-v2/frames','runtime-v3/frames'),encoding='utf-8')
    subprocess.run([sys.executable,str(package)],cwd=ROOT,check=True)
    shutil.copy2(source,OUT/'source/idle-corrected.png')
    provenance=json.loads((OUT/'provenance.json').read_text(encoding='utf-8'))
    provenance['animationSource']='source/idle-corrected.png'
    provenance['sourceHashes']['idle-corrected.png']=hashlib.sha256(source.read_bytes()).hexdigest()
    provenance['revision']='Image-tool edit to stabilize facial identity while retaining wing-flex poses; earlier take and diagnostics retained.'
    (OUT/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
    forge('build_animation_clips.py','--manifest',OUT/'clips.json','--preview-scale',1,'--output-dir',ART/'clips-v3')
    forge('sheet_qc.py','frames','--frames',*sorted((OUT/'frames').glob('*.png')),'--frames-per-row',3,'--cycle','none','--facing','right','--no-loop','--game-pixel',3.2,'--output-dir',ART/'qa/runtime-frames-v3',diagnostic=True)
    forge('sheet_qc.py','spill','--input',OUT/'wind-owl.png','--rows',2,'--cols',3,'--output-dir',ART/'qa/runtime-atlas-v3',diagnostic=True)
    subprocess.run([sys.executable,str(Path(__file__).with_name('finish.py')),'wind-owl'],cwd=ROOT,check=True)

if __name__=='__main__': main()
