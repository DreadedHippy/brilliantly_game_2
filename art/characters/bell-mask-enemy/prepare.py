"""Adapt the existing companion asset packager for one enemy idle asset."""
from pathlib import Path
import json

ART=Path(__file__).resolve().parent
ROOT=ART.parents[2]
BASE=ROOT/'art/characters/storm-companion'

def main():
    (ART/'source').mkdir(exist_ok=True)
    plan={'name':'bell-mask-enemy','workingLabel':'Bell-mask enemy (descriptive asset label, not a lore name)','art_source':'host_image','route':'host-image_gen','identityReference':'User-attached tall wooden-mask, twin-sickle enemy reference','style':'Smooth painted 2D HD matching the hero, mentor and companions','facing':'left-three-quarter','motion':'Grounded calm breathing; tiny cloth, raffia and bell sway, faint local cyan eye/wisp pulse. Two planted feet; two low-held sickles. No steps, attacks or duplicate ghost figure.','runtime':{'canvas':[512,384],'anchor':[256,320],'restSilhouetteHeight':256,'suggestedGameHeight':96},'sourcePoses':6,'playback':'10-step pingpong at 5fps, 2 seconds','scope':'Assets and standalone preview only; no encounter placement or battle logic'}
    (ART/'asset-plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
    s=(BASE/'package.py').read_text(encoding='utf-8')
    s=s.replace('storm-companion','bell-mask-enemy').replace('Storm companion','Bell-mask enemy').replace('STORM COMPANION','BELL-MASK ENEMY')
    s=s.replace('companion-following behavior or level placement','enemy encounter placement or battle logic').replace('companion-following','enemy AI').replace('companion bundle','enemy bundle')
    s=s.replace('horns, mane and tail silhouette; not shoulder height','full mask, robes and weapon silhouette; not shoulder height').replace('horns and curled tail','tall mask, robes and blades')
    s=s.replace("'suggestedGameBodyHeight':80","'suggestedGameBodyHeight':96").replace('80px','96px').replace('0.3125','0.375')
    s=s.replace('width="160" height="120"','width="192" height="144"')
    s=s.replace("'role':'npc'","'role':'enemy'")
    s=s.replace('following AI are separate work','battle logic are separate work').replace('automated creature checks','automated sprite checks')
    s=s.replace('User-supplied mythical creature companion image in this conversation','User-supplied tall wooden-mask, twin-sickle enemy image in this conversation')
    s=s.replace('User previously selected image-generated frame-by-frame animation; retained for this creature.','User previously selected image-generated frame-by-frame animation; retained for this enemy.')
    s=s.replace('soft cloud/electrical edges retained','soft cloth fringes and local cyan wisps retained')
    s=s.replace('Animated mythical creature companion','Animated masked enemy')
    s=s.replace('Gold, storm-cloud fur, and blue lightning. A calm breathing loop from your creature reference.','Carved wood, indigo cloth, brass bells and twin sickles. A calm breathing loop from your enemy reference.')
    s=s.replace('A fixed canvas and root keep the paws grounded as the mane and tail breathe.','A shared scale and root keep the feet planted while cloth and bells sway.')
    s=s.replace('Smooth 2D companion art, generated with the image tool.','Smooth 2D enemy art, generated with the image tool.').replace('Soft storm-fur and energy transparency is preserved.','Soft cloth fringes and cyan wisp transparency are preserved.')
    (ART/'package.py').write_text(s,encoding='utf-8')
    print('Prepared bell-mask enemy package.')

if __name__=='__main__': main()
