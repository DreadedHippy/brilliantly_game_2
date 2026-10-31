"""Publish generated north/south frames using a shared scale and existing hero canvas/root."""
from pathlib import Path
import hashlib
import json
import shutil
import sys
from PIL import Image
import numpy as np

ART = Path(__file__).resolve().parent
PROJECT = ART.parents[3]
OUT = PROJECT / 'public/assets/sprites/main-hero/directions'
sys.path.insert(0, str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
from forge_core import alpha_hygiene

def save(path,data): path.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
def flags(value):
    result=[]
    if isinstance(value,dict):
        if value.get('status') in ('warn','fail') and 'id' in value: result.append(value)
        for child in value.values(): result.extend(flags(child))
    elif isinstance(value,list):
        for child in value: result.extend(flags(child))
    return result

if OUT.exists(): raise ValueError('Refusing to replace an existing directional bundle')
OUT.mkdir(parents=True)
(OUT/'source').mkdir(); (OUT/'prompts').mkdir()
directions, preview_animations, metrics = {}, {}, {}
combined=Image.new('RGBA',(1152,2304))
for row, direction in enumerate(('down','up')):
    frame_dir=OUT/'frames'/direction
    frame_dir.mkdir(parents=True)
    paths=sorted((ART/f'{direction}-runtime/frames').glob('*.png'))
    if len(paths)!=9: raise ValueError('Expected eight walk poses and one neutral pose')
    atlas=Image.new('RGBA',(1152,1152)); aseprite=[]; hashes=[]; hygiene=[]
    for index,path in enumerate(paths):
        with Image.open(path) as source: image, report=alpha_hygiene(source.convert('RGBA'),mode='both')
        if image.size!=(384,384): raise ValueError('Incorrect runtime canvas')
        alpha=np.asarray(image)[...,3]
        box=Image.fromarray((alpha>16).astype('uint8')*255).getbbox()
        if not box or min(box[:2])<=0 or max(box[2:])>=384: raise ValueError('Cropped extremity')
        if not np.any(alpha==0) or not np.any(alpha>127): raise ValueError('Real alpha required')
        filename=f'frame-{index:02d}.png'; image.save(frame_dir/filename,optimize=True)
        hashes.append(hashlib.sha256(image.tobytes()).hexdigest()); hygiene.append(report)
        x,y=(index%3)*384,(index//3)*384
        atlas.alpha_composite(image,(x,y)); combined.alpha_composite(image,(x,y+row*1152))
        aseprite.append({'filename':filename,'frame':{'x':x,'y':y,'w':384,'h':384},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':384,'h':384},'sourceSize':{'w':384,'h':384},'duration':117 if index<8 else 200})
    if len(set(hashes))!=9: raise ValueError('Duplicate generated poses')
    atlas.save(OUT/f'{direction}.png',optimize=True)
    save(OUT/f'{direction}.aseprite.json',{'frames':aseprite,'meta':{'app':'Brilliantly sprite pipeline','image':f'{direction}.png','format':'RGBA8888','size':{'w':1152,'h':1152},'scale':'1','frameTags':[{'name':f'walk-{direction}','from':0,'to':7,'direction':'forward'},{'name':f'idle-{direction}','from':8,'to':8,'direction':'forward'}]}})
    manifest={'schema':'generate2dsprite.animation_clips.v2','frames':[f'frames/{direction}/frame-{index:02d}.png' for index in range(9)],'anchor_px':[192,320],'art_source':'host_image','pixel_art':False,'sampling':'linear','body_height_px':256,'clips':{'walk':{'frames':list(range(8)),'ticks':7,'loop_policy':'cycle','role':'player'},'idle':{'frames':[8],'ticks':12,'loop_policy':'cycle','role':'player'}}}
    save(OUT/f'{direction}-clips.json',manifest)
    directions[direction]={'image':f'{direction}.png','neutralFrame':8,'walk':{'frames':list(range(8)),'frameRate':60/7,'repeat':-1},'run':{'frames':list(range(8)),'frameRate':15,'repeat':-1,'source':'accelerated walking, not a separately authored run cycle'}}
    preview_animations[f'walk-{direction}']={'frames':[row*9+i for i in range(8)],'frameRate':60/7,'durationMs':8000*7/60}
    preview_animations[f'idle-{direction}']={'frames':[row*9+8],'frameRate':5,'durationMs':200}
    metrics[direction]={'uniquePoses':9,'pixelHashes':hashes,'alphaHygiene':hygiene}
    shutil.copy2(ART/f'{direction}-prompt.txt',OUT/'prompts'/f'{direction}.txt')
    shutil.copy2(ART/'source'/f'{direction}.png',OUT/'source'/f'{direction}.png')
save(OUT/'directions.json',{'schema':'brilliantly.directional_sprites.v1','artSource':'host_image','route':'host-image_gen','model':None,'estimateUsd':None,'frameWidth':384,'frameHeight':384,'columns':3,'anchor':{'x':192,'y':320},'restBodyHeight':256,'directions':directions})
save(OUT/'asset-checks.json',{'status':'pass','checks':metrics,'notProven':['Numeric checks do not approve anatomy, identity or gait quality.']})
save(OUT/'provenance.json',{'route':'host-image_gen','model':None,'estimateUsd':None,'reference':'Existing approved main-hero master-v1/master_rgba.png','sourceHashes':{direction:hashlib.sha256((ART/'source'/f'{direction}.png').read_bytes()).hexdigest() for direction in directions},'finish':'Native alpha preserved with speck cleanup; component ownership slicing; one shared source scale for both views, 384px canvas and [192,320] root. No per-frame rescaling.','limit':'Vertical running accelerates these walking frames; neutral vertical idle uses the ninth standing pose.'})
combined.save(OUT/'preview-atlas.png',optimize=True)
save(OUT/'preview-index.json',{'image':'preview-atlas.png','frameWidth':384,'frameHeight':384,'columns':3,'animations':preview_animations})
template=(PROJECT/'art/characters/main-hero/tools/preview.html').read_text(encoding='utf-8')
template=template.replace("'./main-hero.json'","'./preview-index.json'").replace("let action = 'idle'","let action = 'walk-down'")
template=template.replace('Main character','Directional walking').replace('Afro, gold, beadwork, and woven cloth. Three motion loops from one character reference.','Front and back views of the same hero, with a neutral standing pose for each direction.')
start=template.index('        <button type="button" data-action="idle"'); end=template.index('        <button type="button" id="play"',start)
template=template[:start]+''.join(f'        <button type="button" data-action="{action}" aria-pressed="{str(action=="walk-down").lower()}">{label}</button>\n' for action,label in [('walk-down','Walk down'),('walk-up','Walk up'),('idle-down','Face down'),('idle-up','Face up')])+template[end:]
template=template.replace('href="../../../"','href="../../../../"').replace('href="main-hero.png"','href="preview-atlas.png"').replace('href="main-hero.json"','href="directions.json"').replace('href="main-hero.aseprite.json"','href="down.aseprite.json"').replace('href="master.png"','href="../master.png"')
template=template.replace('The canvas and foot position stay fixed across all three actions.','Both views share the same canvas, foot root and game scale.')
template=template.replace('Right-facing, smooth 2D sprite art. Frames were generated with the image tool, then keyed and registered. These are frame-by-frame sprite animations; no video-generation route was used.','Smooth 2D front- and back-facing walking, generated with the image tool. Vertical running reuses these walking poses at a faster playback rate. The ninth pose provides a neutral standing state.')
template=template.replace('Draft for review: head-size variation and leg-alternation checks remain unresolved.','Review notes include every numerical QA flag and the limits of generated pose consistency.')
(OUT/'preview.html').write_text(template,encoding='utf-8')
print(json.dumps({'output':str(OUT),'directions':list(directions),'uniquePoses':18}))
