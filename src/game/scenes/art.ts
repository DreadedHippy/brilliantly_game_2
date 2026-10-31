import Phaser from 'phaser';
import { color, palette } from '../theme';

export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 16,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: `${size}px`,
      color: palette.text,
    })
    .setOrigin(0.5);
}

export function landscape(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(color('ink')).fillRect(0, 0, 960, 540);
  // Abstract contour lines: placeholder world art, not a geographic map.
  for (let i = 0; i < 7; i += 1) {
    g.lineStyle(1, color('border'), 0.3);
    g.strokeEllipse(650, 240, 210 + i * 100, 130 + i * 65);
  }
  g.fillStyle(color('land'), 0.65);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(90, 100),
      new Phaser.Math.Vector2(360, 65),
      new Phaser.Math.Vector2(450, 145),
      new Phaser.Math.Vector2(780, 75),
      new Phaser.Math.Vector2(850, 295),
      new Phaser.Math.Vector2(640, 460),
      new Phaser.Math.Vector2(310, 470),
      new Phaser.Math.Vector2(130, 340),
    ],
    true,
  );
  g.lineStyle(18, color('river'), 0.18);
  g.beginPath()
    .moveTo(100, 0)
    .lineTo(290, 170)
    .lineTo(245, 320)
    .lineTo(390, 540)
    .strokePath();
  label(scene, 780, 475, 'N ↑', 16);
}

export function courier(scene: Phaser.Scene): void {
  if (scene.textures.exists('courier')) return;
  const g = scene.add.graphics();
  g.fillStyle(color('ink'), 0.4).fillEllipse(18, 43, 30, 10);
  g.fillStyle(color('gold')).fillRoundedRect(7, 19, 23, 23, 5);
  g.fillStyle(0x925c42).fillCircle(18, 13, 9);
  g.fillStyle(color('river')).fillRect(8, 24, 21, 6);
  g.generateTexture('courier', 36, 50);
  g.destroy();
}
