import Phaser from 'phaser';
import type { Level } from '../data/levels';
import { color } from '../theme';
import { setBattleReady, showExploration } from '../../ui/shell';
import { label, landscape } from './art';

export class ExplorationScene extends Phaser.Scene {
  private level!: Level;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private destination: Phaser.Math.Vector2 | null = null;
  private ready = false;

  constructor() {
    super('exploration');
  }

  init({ level }: { level: Level }): void {
    this.level = level;
    this.destination = null;
    this.ready = false;
  }

  create(): void {
    landscape(this);
    label(this, 480, 70, this.level.name, 28);
    const path = this.add.graphics().lineStyle(54, color('gold'), 0.12);
    path
      .beginPath()
      .moveTo(190, 370)
      .lineTo(450, 280)
      .lineTo(745, 230)
      .strokePath();
    this.add
      .circle(745, 230, 50, color('gold'), 0.12)
      .setStrokeStyle(2, color('gold'));
    this.add.rectangle(745, 230, 28, 40, color('gold'));
    label(this, 745, 160, 'Training encounter', 17);
    this.player = this.physics.add.sprite(190, 370, 'courier');
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(24, 28);
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable');
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,S,D') as typeof this.keys;
    // Capture gameplay keys only while the game surface is focused.
    keyboard.removeCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
    const gameElement = document.querySelector<HTMLElement>('#game');
    const encounterKey = (): void => {
      if (document.activeElement === gameElement) this.beginBattle();
    };
    keyboard.on('keydown-E', encounterKey);
    const preventScroll = (event: KeyboardEvent): void => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
          event.key,
        )
      )
        event.preventDefault();
    };
    gameElement?.addEventListener('keydown', preventScroll);
    const stopOnBlur = (): void => {
      this.destination = null;
      this.player.setVelocity(0);
    };
    gameElement?.addEventListener('focusout', stopOnBlur);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      gameElement?.focus({ preventScroll: true });
      this.destination = new Phaser.Math.Vector2(
        pointer.worldX,
        pointer.worldY,
      );
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameElement?.removeEventListener('keydown', preventScroll);
      gameElement?.removeEventListener('focusout', stopOnBlur);
      this.input.removeAllListeners('pointerdown');
      keyboard.off('keydown-E', encounterKey);
      keyboard.resetKeys();
    });
    showExploration(
      this.level,
      () => this.beginBattle(),
      () => this.scene.start('world-map'),
    );
  }

  update(): void {
    if (!this.player?.body) return;
    this.player.setVelocity(0);
    if (document.activeElement?.id !== 'game') return;
    const x =
      Number(this.cursors.right.isDown || this.keys.D.isDown) -
      Number(this.cursors.left.isDown || this.keys.A.isDown);
    const y =
      Number(this.cursors.down.isDown || this.keys.S.isDown) -
      Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(x, y);
    if (direction.lengthSq() > 0) this.destination = null;
    else if (this.destination) {
      direction.set(
        this.destination.x - this.player.x,
        this.destination.y - this.player.y,
      );
      if (direction.length() < 8) {
        this.destination = null;
        direction.set(0, 0);
      }
    }
    direction.normalize().scale(230);
    this.player.setVelocity(direction.x, direction.y);
    this.ready =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, 745, 230) < 80;
    setBattleReady(this.ready);
  }

  private beginBattle(): void {
    if (this.ready) this.scene.start('battle', { level: this.level });
  }
}
