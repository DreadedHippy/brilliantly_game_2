"""Package generated companion frames without reposing, per-frame resizing, or redrawing."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys
import zipfile

import numpy as np
from PIL import Image, ImageDraw

ART=Path(__file__).resolve().parent
PROJECT=ART.parents[2]
OUT=PROJECT/'public/assets/sprites/wind-owl'
sys.path.insert(0,str(Path.home()/'.codex/skills/generate2dsprite/scripts'))
from forge_core import alpha_hygiene

def save(path,value): path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
def archive():
    path=OUT.parent/'wind-owl-bundle.zip'
    with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED) as bundle:
        for item in sorted(OUT.rglob('*')):
            if item.is_file(): bundle.write(item,Path('wind-owl')/item.relative_to(OUT))
    with zipfile.ZipFile(path) as bundle:
        if bundle.testzip() is not None: raise ValueError('ZIP CRC failure')
    print(json.dumps({'archive':str(path),'bytes':path.stat().st_size,'zipCRC':'verified'}))

def main():
    if OUT.exists(): raise ValueError('Refusing to replace an existing companion bundle')
    OUT.mkdir(parents=True)
    for directory in ('frames','source','prompts','qa'): (OUT/directory).mkdir()
    paths=sorted((ART/'runtime-v3/frames').glob('*.png'))
    if len(paths)!=6: raise ValueError('Expected six genuine generated idle poses')
    atlas=Image.new('RGBA',(1536,768)); strip=Image.new('RGBA',(3072,384))
    review=Image.new('RGB',(6*192,180),'#202b47'); labels=ImageDraw.Draw(review)
    aseprite=[]; metrics=[]; hashes=[]
    for index,path in enumerate(paths):
        with Image.open(path) as source: image,hygiene=alpha_hygiene(source.convert('RGBA'),mode='floor')
        if image.size!=(512,384): raise ValueError('Incorrect shared canvas')
        pixels=np.asarray(image); alpha=pixels[...,3]
        box=Image.fromarray((alpha>16).astype('uint8')*255).getbbox()
        edge=max(int(alpha[0].max()),int(alpha[-1].max()),int(alpha[:,0].max()),int(alpha[:,-1].max()))
        if box is None or edge>4: raise ValueError('Creature or energy fringe touches frame edge')
        if not np.any(alpha==0) or not np.any(alpha>127): raise ValueError('True alpha and visible creature required')
        digest=hashlib.sha256(image.tobytes()).hexdigest(); hashes.append(digest)
        name=f'idle-{index:02d}.png'; image.save(OUT/'frames'/name,optimize=True)
        x,y=index%3*512,index//3*384
        atlas.alpha_composite(image,(x,y)); strip.alpha_composite(image,(index*512,0))
        aseprite.append({'filename':name,'frame':{'x':x,'y':y,'w':512,'h':384},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':512,'h':384},'sourceSize':{'w':512,'h':384},'duration':200})
        tile=Image.new('RGBA',(192,144),'#202b47'); tile.alpha_composite(image.resize((192,144),Image.Resampling.LANCZOS)); review.paste(tile.convert('RGB'),(index*192,24)); labels.text((index*192+10,7),f'Idle {index+1}',fill='#f5edda')
        metrics.append({'frame':name,'alphaBounds':list(box),'edgeAlphaMax':edge,'pixelHash':digest,'semitransparentPixels':int(np.sum((alpha>4)&(alpha<250))),'alphaHygiene':hygiene})
    if len(set(hashes))!=6: raise ValueError('Duplicate pixels cannot supply an animation')
    atlas.save(OUT/'wind-owl.png',optimize=True); strip.save(OUT/'idle.png',optimize=True); review.save(OUT/'contact-sheet.png',optimize=True)
    shutil.copy2(ART/'master-v1/master_rgba.png',OUT/'master.png')
    sequence=[0,1,2,3,4,5,4,3,2,1]
    save(OUT/'wind-owl.json',{'schema':'brilliantly.sprite.v1','name':'wind-owl','artSource':'host_image','route':'host-image_gen','model':None,'estimateUsd':None,'image':'wind-owl.png','frameWidth':512,'frameHeight':384,'columns':3,'anchor':{'x':256,'y':320},'facing':'right-three-quarter','restBodyHeight':256,'restHeightIncludes':'wings, ear tufts and wind ribbons; full silhouette, not shoulder height','suggestedGameBodyHeight':80,'animations':{'idle':{'frames':sequence,'uniquePoses':6,'frameRate':5,'ticksPerFrame':12,'tickHz':60,'durationMs':2000,'repeat':-1,'preview':'idle.webp','sheet':'idle.png'}},'limits':['One right-facing camera and idle action only.','No companion-following behavior or level placement is implemented by this asset bundle.','Read QA.md for numerical diagnostics and art-review limits.']})
    save(OUT/'wind-owl.aseprite.json',{'frames':aseprite,'meta':{'app':'Brilliantly sprite pipeline','version':'1','image':'wind-owl.png','format':'RGBA8888','size':{'w':1536,'h':768},'scale':'1','frameTags':[{'name':'idle','from':0,'to':5,'direction':'pingpong'}]}})
    save(OUT/'clips.json',{'schema':'generate2dsprite.animation_clips.v2','frames':[f'frames/idle-{i:02d}.png' for i in range(6)],'anchor_px':[256,320],'art_source':'host_image','pixel_art':False,'sampling':'linear','body_height_px':256,'clips':{'idle':{'frames':list(range(6)),'ticks':12,'tick_hz':60,'loop_policy':'pingpong','role':'npc'}}})
    save(OUT/'asset-checks.json',{'status':'pass','uniquePoses':6,'canvas':[512,384],'checks':metrics,'notProven':['Anatomy, facial identity, intentional energy motion and artistic loop quality require visual review.']})
    source_hashes={}
    for name in ('master-generated.png','idle-generated.png'):
        source=ART/'source'/name; shutil.copy2(source,OUT/'source'/name); source_hashes[name]=hashlib.sha256(source.read_bytes()).hexdigest()
    for prompt in ART.glob('*prompt.txt'): shutil.copy2(prompt,OUT/'prompts'/prompt.name)
    save(OUT/'provenance.json',{'art_source':'host_image','route':'host-image_gen','model':None,'estimateUsd':None,'price':'unknown; not returned by built-in tool','identityReference':'User-supplied mythical creature companion image in this conversation','animationReference':'master-v1/master_rgba.png','sourceHashes':source_hashes,'routeDecision':'User previously selected image-generated frame-by-frame animation; retained for this creature.','finish':'Native alpha, component-ownership slicing, one shared scale/root, premultiplied downsampling and alpha-floor cleanup only; soft elemental-effect edges retained.','integration':'Generated assets and standalone preview only.'})
    template=(PROJECT/'art/characters/main-hero/tools/preview.html').read_text(encoding='utf-8')
    template=template.replace('main-hero','wind-owl').replace('Main character','Wind owl')
    template=re.sub(r'\s*<button type="button" data-action="(?:walk|run)"[^>]*>.*?</button>','',template)
    template=template.replace('Afro, gold, beadwork, and woven cloth. Three motion loops from one character reference.','Ivory feathers, gold edging and pale mint wind. Hovering idle with small coordinated wing flex, feather motion and pale mint wind ribbons. Two feet relaxed in air.')
    template=template.replace('width="384" height="384"','width="512" height="384"').replace('width="144" height="144"','width="160" height="120"').replace('96px body','80px silhouette').replace('256px body','256px silhouette')
    template=template.replace('Animated main character','Animated mythical creature companion').replace('The canvas and foot position stay fixed across all three actions.','A fixed canvas preserves the hovering pose and wing motion.')
    template=template.replace('Right-facing, smooth 2D sprite art. Frames were generated with the image tool, then keyed and registered. These are frame-by-frame sprite animations; no video-generation route was used.','Smooth 2D companion art, generated with the image tool. Six drawn poses play forward and back as a two-second idle loop. Soft elemental-effect transparency is preserved.')
    template=template.replace('Draft for review: head-size variation and leg-alternation checks remain unresolved.','The QA notes retain every numerical warning and the limits of automated creature checks.')
    (OUT/'preview.html').write_text(template,encoding='utf-8')
    (OUT/'README.txt').write_text('WIND OWL — IDLE ASSET\n\nServe preview.html through the project Vite server.\nPNG atlas: wind-owl.png, 3 columns x 2 rows of 512x384 frames.\nHorizontal idle strip: idle.png, 6 columns x 1 row of 512x384 frames.\nPlayback: 0,1,2,3,4,5,4,3,2,1 at 5fps, 2-second loop.\nRoot [256,320]; suggested display scale 0.3125 for 80px silhouette height.\nHeight includes wings, ear tufts and wind ribbons, not shoulder height.\nEngine metadata, Aseprite JSON, animated WebP, master, prompts, original art and provenance are included.\nOne right-facing idle view only; level placement and following AI are separate work.\nRead QA.md for diagnostics and visual-review limits.\n',encoding='utf-8')
    print(json.dumps({'output':str(OUT),'uniquePoses':6,'steps':10,'canvas':[512,384]}))

if __name__=='__main__': main()
