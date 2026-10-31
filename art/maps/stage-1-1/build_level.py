"""Compose generated terrain materials and author the shared navigation/art level bundle."""
from pathlib import Path
import hashlib
import json
import math
import random
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

PROJECT = Path(__file__).resolve().parents[3]
ART = PROJECT / 'art/maps/stage-1-1'
OUT = PROJECT / 'public/assets/maps/stage-1-1'
layout = json.loads((OUT / 'layout.json').read_text(encoding='utf-8'))
manifest = json.loads((OUT / 'props/prop-pack.json').read_text(encoding='utf-8'))


def save(path, value): path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def sample_trail():
    controls, samples = layout['road']['controlPoints'], layout['road']['samplesPerSegment']
    result = []
    for i in range(len(controls) - 1):
        a, b, c, d = controls[max(0, i-1)], controls[i], controls[i+1], controls[min(len(controls)-1, i+2)]
        for step in range(samples):
            t = step/samples
            result.append([0.5 * (2*b[axis] + (-a[axis]+c[axis])*t + (2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t*t + (-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t*t*t) for axis in (0, 1)])
    return result + [controls[-1]]


def ribbon(points, radius):
    left, right = [], []
    for i, point in enumerate(points):
        a, b = points[max(0,i-1)], points[min(len(points)-1,i+1)]
        dx, dy = b[0]-a[0], b[1]-a[1]
        length = math.hypot(dx,dy)
        normal = [-dy/length, dx/length]
        left.append([point[0]+normal[0]*radius, point[1]+normal[1]*radius])
        right.append([point[0]-normal[0]*radius, point[1]-normal[1]*radius])
    def cap(point, start):
        angle = math.atan2(start[1]-point[1], start[0]-point[0])
        return [[point[0]+math.cos(angle-math.pi*t/12)*radius, point[1]+math.sin(angle-math.pi*t/12)*radius] for t in range(1,12)]
    return left + cap(points[-1],left[-1]) + list(reversed(right)) + cap(points[0],right[0])


def tile(texture, size):
    result = Image.new('RGB',size)
    for y in range(0,size[1],texture.height):
        for x in range(0,size[0],texture.width):
            piece = ImageOps.mirror(texture) if (x//texture.width)%2 else texture
            piece = ImageOps.flip(piece) if (y//texture.height)%2 else piece
            result.paste(piece,(x,y))
    return result


points = sample_trail()
width, height = layout['world']['width'], layout['world']['height']
polygon = ribbon(points,layout['road']['width']/2)
movement_bounds = layout['navigation']['bounds']
actor_radius = layout['player']['radius']
left,top = movement_bounds['x']-actor_radius,movement_bounds['y']-actor_radius
right,bottom = movement_bounds['x']+movement_bounds['width']+actor_radius,movement_bounds['y']+movement_bounds['height']+actor_radius
walk_region = [[left,top],[right,top],[right,bottom],[left,bottom]]
with Image.open(ART/'source/terrain.png') as source:
    source = source.convert('RGB')
    # Material panels preserve aspect; one shared uniform scale is used per texture.
    grass = source.crop((0,0,source.width//2,source.height))
    dirt = source.crop((source.width//2,0,source.width,source.height))
    grass = grass.resize((384,round(grass.height*384/grass.width)),Image.Resampling.LANCZOS)
    dirt = dirt.resize((384,round(dirt.height*384/dirt.width)),Image.Resampling.LANCZOS)
grass.save(OUT/'grass.webp',quality=92)
dirt.save(OUT/'earth.webp',quality=92)
ground = tile(grass,(width,height))
road = tile(dirt,(width,height))
mask = Image.new('L',(width,height))
ImageDraw.Draw(mask).polygon([tuple(p) for p in polygon],fill=255)
edge = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2))
ground.paste(ImageEnhance.Brightness(road).enhance(0.68),(0,0),edge)
ground.paste(road,(0,0),mask.filter(ImageFilter.GaussianBlur(1)))
ground.save(OUT/'ground.webp',quality=92,method=6)

registry = {item['label']:item for item in manifest['accepted']}
assets = [{'texture':f'stage-{label}','image':f'props/{item["image"]}'} for label,item in registry.items()]
props = []
def place(label,x,y,display_height):
    item = registry[label]
    w,h = item['output_size']
    body_height = item['crop_bbox'][3]-item['crop_bbox'][1]
    props.append({'id':f'{label}-{len(props):03d}','texture':f'stage-{label}','image':f'props/{item["image"]}',
        'x':round(x,2),'y':round(y,2),'height':round(display_height,2),
        'anchor':{'x':item['anchor_px'][0]/w,'y':item['anchor_px'][1]/h},
        'sourceHeight':body_height,
        'radius':round({'baobab':28/285,'acacia':18/235,'rocks':22/58,'jars':20/42,'sign':12/53}.get(label,0)*display_height,2)})

randomizer = random.Random(1101)
for i,p in enumerate(points):
    if i%5==0:
        place('grass',p[0]+randomizer.uniform(-28,28),p[1]-randomizer.uniform(125,175),randomizer.uniform(30,52))
        place('grass',p[0]+randomizer.uniform(-28,28),p[1]+randomizer.uniform(135,195),randomizer.uniform(28,48))
    if i%12==3:
        place('acacia' if i%24 else 'baobab',p[0]-65,p[1]-randomizer.uniform(155,195),randomizer.uniform(205,280))
        place('rocks',p[0]+55,p[1]+randomizer.uniform(160,205),randomizer.uniform(48,75))
    if i%16==8 and p[1]+400 < height-40:
        place('baobab',p[0]+80,p[1]+400,randomizer.uniform(225,285))
place('baobab',370,365,285)
place('acacia',740,365,235)
place('jars',620,405,42)
place('grass',440,442,33)
place('sign',360,660,58)
for encounter in layout['encounters']:
    place('rocks',encounter['x']+75,encounter['y']-135,58)
    place('sign',encounter['x']-72,encounter['y']-165,53)
place('sign',layout['exit']['x']+75,layout['exit']['y']-125,76)
save(OUT/'environment.json',{'assets':assets,'props':props})
objects = []
for item in props:
    source=registry[item['texture'].removeprefix('stage-')]
    objects.append({'id':item['id'],'prop':source['label'],'image':item['image'],
        'x':item['x'],'y':item['y'],'scale':item['height']/item['sourceHeight'],
        'anchor_px':source['anchor_px'],'solid':False,'layer':'scenery','occupant_policy':'y_sort'})
objects.append({'id':layout['npc']['id'],'prop':'mentor','image':'../../sprites/tutorial-elder/master.png',
    'x':layout['npc']['x'],'y':layout['npc']['y'],'scale':layout['npc']['height']/600,
    'anchor_px':[512,888],'solid':False,'layer':'scenery','occupant_policy':'y_sort'})
bundle = {'schema':'generate2dmap.map_bundle.v2','id':layout['id'],'name':'Stage 1-1 · The first trail',
    'world':{**layout['world'],'unit':'px'},'layers':[{'name':'ground','kind':'image','image':'ground.webp'},{'name':'scenery','kind':'objects'}],
    'objects':objects,'collision':{'actorRadius':layout['player']['radius'],'ySquash':1,
        'walkRegions':[{'polygon':walk_region}],
        'solids':[{'id':'mentor-footprint','shape':'ellipse','cx':layout['npc']['x'],'cy':layout['npc']['y'],'rx':layout['npc']['radius'],'ry':layout['npc']['radius']}] +
            [{'id':p['id']+'-footprint','shape':'ellipse','cx':p['x'],'cy':p['y'],'rx':p['radius'],'ry':p['radius']} for p in props if p['radius'] > 0]},
    'roads':[{'id':'main-trail','width':layout['road']['width'],'polyline':points}],
    'spawns':[{'id':'arrival','x':layout['player']['x'],'y':layout['player']['y'],'facing':'right'}],
    'anchors':{**{p['id']:{'point':[p['x'],p['y']],'approach':[p['x'],p['y']]} for p in layout['encounters']},
        'mentor-approach':{'point':[510,535],'approach':[510,535]},
        'exit':{'point':[layout['exit']['x'],layout['exit']['y']],'approach':[layout['exit']['x'],layout['exit']['y']]},
        'north-meadow':{'point':[1550,400],'approach':[1550,400]},
        'south-meadow':{'point':[2350,1260],'approach':[2350,1260]}},
    'nav':{'cell':7},'camera':{'bounds':[0,0,width,height],'zoom':layout['camera']['zoom'],'userZoom':False},
    'art_source':'host_image','placeholder':False,
    'provenance':{'tool':'Brilliantly stage compositor','version':'1','params':{'layout':'layout.json'},'inputs':[],
        'route':'host-image_gen','model':None,'estimateUsd':None,'layout':'User-provided winding Stage 1-1 outline',
        'composition':'Image-generated terrain materials uniformly sampled and tiled, masked by the canonical road polygon. Independent generated props are Y-sorted in Phaser. No image aspect ratios stretched.'}}
save(OUT/'map-bundle.json',bundle)
save(OUT/'provenance.json',{'route':'host-image_gen','art_source':'host_image','model':None,'estimateUsd':None,
    'sources':{name:{'path':str((ART/'source'/name).relative_to(PROJECT)).replace('\\','/'),'sha256':digest(ART/'source'/name)} for name in ['terrain.png','props.png']},
    'prompts':{name:(ART/name).read_text(encoding='utf-8') for name in ['terrain-prompt.txt','props-prompt.txt']},
    'scale':{'world':[width,height],'texture_panel_width':384,'characterHeight':96,'seatedNpcHeight':72},
    'limits':['Tutorial dialogue, battles and the Stage 1-2 transition are intentionally inactive.','Character art retains its existing sprite QA notes.']})
print(json.dumps({'ground':str(OUT/'ground.webp'),'world':[width,height],'props':len(props),'roadSamples':len(points)}))
