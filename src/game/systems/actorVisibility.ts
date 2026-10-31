import Phaser from 'phaser';
import { color } from '../theme';

/** Sample real actor and canopy alpha; keep a faint actor-shaped cue above actual occlusion. */
export class ActorVisibility {
  private readonly alpha = new Map<
    string,
    { pixels: Uint8Array; width: number; height: number }
  >();
  private readonly samples = new Map<string, { x: number; y: number }[]>();
  private readonly cue: Phaser.GameObjects.Sprite;
  private readonly trees: {
    image: Phaser.GameObjects.Image;
    bounds: Phaser.Geom.Rectangle;
  }[];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly actor: Phaser.GameObjects.Sprite,
    trees: Phaser.GameObjects.Image[],
  ) {
    this.trees = trees.map((image) => ({ image, bounds: image.getBounds() }));
    this.cue = scene.add
      .sprite(actor.x, actor.y, actor.texture.key, actor.frame.name)
      .setName('hero-visibility-cue')
      .setDepth(9999)
      .setAlpha(0.28)
      .setVisible(false);
    this.cue.setTint(color('gold')).setTintMode(Phaser.TintModes.FILL);
    for (const image of trees) this.readAlpha(image.texture.key);
  }

  private readAlpha(key: string) {
    const cached = this.alpha.get(key);
    if (cached) return cached;
    const source = this.scene.textures
      .get(key)
      .getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(source, 0, 0);
    const rgba = context.getImageData(0, 0, source.width, source.height).data;
    const pixels = new Uint8Array(source.width * source.height);
    for (let i = 0; i < pixels.length; i++) pixels[i] = rgba[i * 4 + 3]!;
    const result = { pixels, width: source.width, height: source.height };
    this.alpha.set(key, result);
    return result;
  }

  update(): void {
    const actor = this.actor,
      frame = actor.frame;
    const key = `${actor.texture.key}:${frame.name}`;
    let samples = this.samples.get(key);
    if (!samples) {
      samples = [];
      const source = this.readAlpha(actor.texture.key);
      for (let y = 5; y < frame.height; y += 10)
        for (let x = 5; x < frame.width; x += 10) {
          if (
            source.pixels[(frame.cutY + y) * source.width + frame.cutX + x]! >
            127
          )
            samples.push({ x, y });
        }
      this.samples.set(key, samples);
    }
    const actorBounds = actor.getBounds();
    let occluded = false;
    for (const { image, bounds } of this.trees) {
      if (
        image.depth <= actor.depth ||
        !Phaser.Geom.Intersects.RectangleToRectangle(bounds, actorBounds)
      )
        continue;
      const source = this.readAlpha(image.texture.key);
      for (const point of samples) {
        const x =
          actor.x +
          (point.x - actor.displayOriginX) *
            actor.scaleX *
            (actor.flipX ? -1 : 1);
        const y = actor.y + (point.y - actor.displayOriginY) * actor.scaleY;
        const px = Math.floor(
          (x - image.x) / image.scaleX + image.displayOriginX,
        );
        const py = Math.floor(
          (y - image.y) / image.scaleY + image.displayOriginY,
        );
        if (
          px >= 0 &&
          py >= 0 &&
          px < source.width &&
          py < source.height &&
          source.pixels[py * source.width + px]! > 127
        ) {
          occluded = true;
          break;
        }
      }
      if (occluded) break;
    }
    this.cue.setVisible(occluded);
    if (occluded)
      this.cue
        .setTexture(actor.texture.key, frame.name)
        .setPosition(actor.x, actor.y)
        .setOrigin(actor.originX, actor.originY)
        .setScale(actor.scaleX, actor.scaleY)
        .setFlipX(actor.flipX);
  }

  destroy(): void {
    this.alpha.clear();
    this.samples.clear();
    this.cue.destroy();
  }
}
