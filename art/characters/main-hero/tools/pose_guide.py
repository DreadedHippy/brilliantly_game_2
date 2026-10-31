"""Draw a geometry-only reference for the image model; never used as final character art."""
from pathlib import Path
from PIL import Image, ImageDraw

output = Path(__file__).resolve().parents[1] / 'source'
for action in ('walk', 'run'):
    image = Image.new('RGB', (1536, 1024), '#eef0ed')
    draw = ImageDraw.Draw(image)
    for index in range(8):
        ox, oy = index % 4 * 384, index // 4 * 512
        phase, reverse = index % 4, index >= 4
        def p(x, y): return (int(ox + x * 384), int(oy + y * 512))
        draw.rectangle((ox + 3, oy + 3, ox + 381, oy + 509), outline='#9aa3a9', width=2)
        draw.line((p(.1, .87), p(.9, .87)), fill='#676f78', width=2)
        draw.ellipse((p(.4, .12), p(.6, .27)), outline='#333333', width=5)
        draw.polygon([p(.57, .17), p(.65, .2), p(.57, .23)], fill='#333333')
        draw.line([p(.5, .28), p(.5, .56)], fill='#333333', width=12)
        forward = [(.54, .69), (.77, .87)]
        backward = [(.38, .72), (.22, .87)]
        if phase == 1:
            forward = [(.55, .73), (.51, .87)]
            backward = [(.4, .7), (.32, .79)]
        if phase == 2:
            forward = [(.58, .68), (.54, .8)]
            backward = [(.46, .72), (.47, .87)]
        if phase == 3:
            forward = [(.64, .69), (.77, .85)]
            backward = [(.34, .74), (.22, .87)]
        if action == 'run':
            if phase == 2:
                forward = [(.67, .58), (.68, .74)]
                backward = [(.38, .73), (.25, .87)]
            if phase == 3:
                forward = [(.68, .65), (.82, .76)]
                backward = [(.3, .7), (.2, .75)]
        opposite = reverse != (phase >= 2)
        near, far = (backward, forward) if opposite else (forward, backward)
        # Far blue is drawn behind, near orange over it. Colours encode depth only.
        draw.line([p(.52, .56), *[p(*point) for point in far]], fill='#277ac2', width=16)
        draw.line([p(.48, .56), *[p(*point) for point in near]], fill='#e17e20', width=16)
        near_arm = [p(.45, .32), p(.63, .39), p(.7, .48)] if opposite else [p(.45, .32), p(.3, .41), p(.25, .5)]
        far_arm = [p(.55, .32), p(.33, .4), p(.29, .49)] if opposite else [p(.55, .32), p(.65, .4), p(.72, .49)]
        draw.line(far_arm, fill='#277ac2', width=12)
        draw.line(near_arm, fill='#e17e20', width=12)
        draw.text((ox + 15, oy + 15), f'{action} {index}: orange NEAR, blue FAR', fill='#333333')
    image.save(output / f'{action}-pose-guide.png')
