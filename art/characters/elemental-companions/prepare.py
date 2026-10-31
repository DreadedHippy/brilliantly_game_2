"""Prepare independent asset packages using the previously reviewed companion pipeline."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'art/characters/storm-companion'
CREATURES=[
    ('earth-tortoise','Earth tortoise','Slow breathing, tiny relaxed head lift, emerald crystal glow and baobab leaf movement. Four feet planted.','baobab, crystals and shell','mossy rock shell, emerald crystals and a living baobab'),
    ('ember-lion','Ember lion','Gentle breathing, flame mane and tail flicker, restrained embers and tiny pendant sway. Four paws planted.','mane and flame-tail silhouette','volcanic fur, golden ornaments and a flame mane'),
    ('wind-owl','Wind owl','Hovering idle with small coordinated wing flex, feather motion and pale mint wind ribbons. Two feet relaxed in air.','wings, ear tufts and wind ribbons','ivory feathers, gold edging and pale mint wind'),
]

def main():
    for slug,title,motion,envelope,identity in CREATURES:
        art=ROOT/'art/characters'/slug
        (art/'source').mkdir(parents=True,exist_ok=True)
        plan={'name':slug,'workingLabel':title+' (descriptive asset label, not a lore name)','art_source':'host_image','route':'host-image_gen','identityReference':'Matching user-attached reference in this conversation','style':'Smooth painted 2D HD, matching the existing companion','facing':'right-three-quarter','motion':motion,'runtime':{'canvas':[512,384],'anchor':[256,320],'restSilhouetteHeight':256,'suggestedGameHeight':80},'sourcePoses':6,'playback':'10-step pingpong at 5fps, 2 seconds','scope':'Assets and standalone preview; no level placement or AI'}
        (art/'asset-plan.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
        package=(BASE/'package.py').read_text(encoding='utf-8')
        package=package.replace('storm-companion',slug).replace('Storm companion',title).replace('STORM COMPANION',title.upper())
        package=package.replace('left-three-quarter','right-three-quarter').replace('left-facing','right-facing')
        package=package.replace('horns, mane and tail silhouette; not shoulder height',envelope+'; full silhouette, not shoulder height').replace('horns and curled tail',envelope)
        package=package.replace('horned storm-feline','elemental '+slug).replace('Soft storm-fur and energy transparency is preserved.','Soft elemental-effect transparency is preserved.')
        package=package.replace('Gold, storm-cloud fur, and blue lightning. A calm breathing loop from your creature reference.',identity.capitalize()+'. '+motion)
        package=package.replace('A fixed canvas and root keep the paws grounded as the mane and tail breathe.', 'A fixed canvas preserves the hovering pose and wing motion.' if slug=='wind-owl' else 'A fixed canvas and shared scale preserve the grounded breathing pose.')
        package=package.replace('soft cloud/electrical edges retained','soft elemental-effect edges retained')
        (art/'package.py').write_text(package,encoding='utf-8')
    print(json.dumps({'prepared':[c[0] for c in CREATURES]}))

if __name__=='__main__': main()
