import Phaser from 'phaser';
import { starterSpells } from '../data/combat';
import type { BattleAction, BattleState } from './battle';
import { color, palette } from '../theme';

export type FeedbackAction = BattleAction | 'trivia';
type Actor = Phaser.GameObjects.Sprite;

/** Small, cancellable presentation cues. The pure battle model remains authoritative. */
export class BattleFeedback {
  private alive = true;
  private pending = new Set<() => void>();
  private effects = new Set<Phaser.GameObjects.GameObject>();
  private rest: Map<
    Actor,
    { x: number; y: number; angle: number; alpha: number }
  >;

  constructor(
    private scene: Phaser.Scene,
    private hero: Actor,
    private enemy: Actor,
  ) {
    this.rest = new Map(
      [hero, enemy].map((actor) => [
        actor,
        { x: actor.x, y: actor.y, angle: actor.angle, alpha: actor.alpha },
      ]),
    );
  }
  private get motion(): boolean {
    return (
      this.alive && !matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
  private tween(
    target: object,
    values: object,
    duration: number,
    yoyo = false,
  ): Promise<void> {
    if (!this.motion) return Promise.resolve();
    return new Promise((resolve) => {
      const done = (): void => {
        this.pending.delete(done);
        resolve();
      };
      this.pending.add(done);
      this.scene.tweens.add({
        targets: target,
        ...values,
        duration,
        yoyo,
        ease: 'Sine.easeInOut',
        onComplete: done,
        onStop: done,
      });
    });
  }
  private track<T extends Phaser.GameObjects.GameObject>(effect: T): T {
    this.effects.add(effect);
    return effect;
  }
  private remove(effect: Phaser.GameObjects.GameObject): void {
    this.effects.delete(effect);
    if (effect.scene) effect.destroy();
  }
  private reset(actor: Actor): void {
    const rest = this.rest.get(actor)!;
    if (actor.scene)
      actor
        .setPosition(rest.x, rest.y)
        .setAngle(rest.angle)
        .setAlpha(rest.alpha);
  }
  private async pulse(
    actor: Actor,
    tint: number,
    name: string,
    radius = 22,
  ): Promise<void> {
    if (!this.motion) return;
    const ring = this.track(
      this.scene.add
        .circle(actor.x, actor.y - actor.displayHeight * 0.3, radius)
        .setStrokeStyle(radius > 22 ? 3 : 2, tint, radius > 22 ? 0.85 : 0.6)
        .setDepth(1000)
        .setName(name),
    );
    await this.tween(ring, { scale: 1.9, alpha: 0 }, 300);
    this.remove(ring);
  }
  private async number(
    actor: Actor,
    text: string,
    positive = false,
  ): Promise<void> {
    if (!this.motion) return;
    const label = this.track(
      this.scene.add
        .text(actor.x + 50, actor.y - 105, text, {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '17px',
          color: positive ? palette.river : palette.text,
          backgroundColor: palette.ink,
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(1001)
        .setName('battle-value-feedback'),
    );
    await this.tween(label, { y: label.y - 14, alpha: 0 }, 440);
    this.remove(label);
  }
  private async hit(
    actor: Actor,
    amount: number,
    direction: number,
  ): Promise<void> {
    if (!this.motion || amount <= 0) return;
    void this.number(actor, `−${amount} HP`);
    await this.tween(
      actor,
      { x: actor.x + direction * 7, alpha: 0.74 },
      100,
      true,
    );
    this.reset(actor);
  }
  private async cast(action: BattleAction): Promise<void> {
    const spell = starterSpells.find((item) => `spell:${item.id}` === action);
    if (!spell || !this.motion) return;
    const tint = color(
      spell.element === 'Fire'
        ? 'gold'
        : spell.element === 'Storm'
          ? 'river'
          : spell.element === 'Wind'
            ? 'text'
            : 'land',
    );
    const orb = this.track(
      this.scene.add
        .container(this.hero.x + 30, this.hero.y - 100)
        .setDepth(1000)
        .setName('battle-spell-fx'),
    );
    const direction = Phaser.Math.RadToDeg(
      Math.atan2(this.enemy.y - 85 - orb.y, this.enemy.x - 15 - orb.x),
    );
    orb.setAngle(direction);
    if (spell.element === 'Fire') {
      orb.add(this.scene.add.circle(0, 0, 23, tint, 0.18));
      orb.add(this.scene.add.circle(0, 0, 13, tint, 0.95));
      orb.add(this.scene.add.circle(3, -2, 6, color('text'), 0.9));
      for (let i = 1; i <= 3; i++)
        orb.add(
          this.scene.add.circle(
            -i * 12,
            i % 2 ? -3 : 3,
            8 - i,
            tint,
            0.65 - i * 0.12,
          ),
        );
    } else if (spell.element === 'Storm') {
      const bolt = this.scene.add.graphics();
      const points = [
        { x: -25, y: 0 },
        { x: -8, y: -10 },
        { x: -12, y: 3 },
        { x: 6, y: -8 },
        { x: 1, y: 7 },
        { x: 24, y: 0 },
      ].map(({ x, y }) => new Phaser.Math.Vector2(x, y));
      bolt.lineStyle(9, tint, 0.2).strokePoints(points, false);
      bolt.lineStyle(3, color('text'), 0.95).strokePoints(points, false);
      orb.add(bolt);
    } else if (spell.element === 'Wind') {
      for (let i = 0; i < 3; i++)
        orb.add(
          this.scene.add
            .ellipse(-i * 14, 0, 15, 34 - i * 5)
            .setStrokeStyle(3, tint, 0.9 - i * 0.2),
        );
    } else {
      for (let i = 0; i < 3; i++)
        orb.add(
          this.scene.add
            .rectangle(
              -i * 12,
              i % 2 ? 9 : -5,
              17 - i * 3,
              17 - i * 3,
              tint,
              0.95,
            )
            .setAngle(35 + i * 20)
            .setStrokeStyle(2, color('gold'), 0.9),
        );
    }
    orb.setData('element', spell.element);
    void this.pulse(this.hero, tint, 'battle-cast-ring', 34);
    await this.tween(this.hero, { angle: -4, x: this.hero.x + 5 }, 90, true);
    if (!this.alive) return;
    await this.tween(
      orb,
      {
        x: this.enemy.x - 15,
        y: this.enemy.y - 85,
        alpha: 0.85,
        angle: spell.element === 'Earth' ? direction + 150 : direction,
      },
      340,
    );
    this.remove(orb);
    if (this.motion) {
      void this.pulse(this.enemy, tint, 'battle-impact-ring', 36);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const chip = this.track(
          this.scene.add
            .circle(
              this.enemy.x - 15,
              this.enemy.y - 85,
              spell.element === 'Earth' ? 5 : 3,
              tint,
              0.85,
            )
            .setDepth(1000)
            .setName('battle-spell-spark'),
        );
        void this.tween(
          chip,
          {
            x: chip.x + Math.cos(angle) * 38,
            y:
              chip.y +
              Math.sin(angle) * 28 -
              (spell.element === 'Fire' ? 12 : 0),
            alpha: 0,
          },
          280,
        ).then(() => this.remove(chip));
      }
    }
  }
  async play(
    action: FeedbackAction,
    before: BattleState,
    after: BattleState,
    phase: (value: 'hero' | 'enemy') => void,
  ): Promise<boolean> {
    if (!this.motion) return this.alive;
    phase('hero');
    if (action === 'attack')
      await this.tween(
        this.hero,
        { x: this.hero.x + 16, y: this.hero.y - 5 },
        125,
        true,
      );
    else if (action === 'guard') {
      void this.pulse(this.hero, color('gold'), 'battle-guard-fx');
      await this.tween(this.hero, { angle: -3, x: this.hero.x - 3 }, 150, true);
    } else if (action === 'trivia') {
      if (after.playerSp > before.playerSp) {
        void this.number(
          this.hero,
          `+${after.playerSp - before.playerSp} SP`,
          true,
        );
        await this.pulse(this.hero, color('river'), 'battle-recovery-fx');
      }
    } else await this.cast(action);
    if (!this.alive) return false;
    this.reset(this.hero);
    await this.hit(this.enemy, before.enemyHp - after.enemyHp, 1);
    if (!this.alive) return false;
    if (after.playerHp < before.playerHp) {
      phase('enemy');
      await this.tween(
        this.enemy,
        { x: this.enemy.x - 13, y: this.enemy.y + 5 },
        120,
        true,
      );
      if (!this.alive) return false;
      this.reset(this.enemy);
      await this.hit(this.hero, before.playerHp - after.playerHp, -1);
    }
    this.reset(this.hero);
    this.reset(this.enemy);
    return this.alive;
  }
  destroy(): void {
    this.alive = false;
    for (const done of [...this.pending]) done();
    for (const effect of [...this.effects]) this.remove(effect);
    this.reset(this.hero);
    this.reset(this.enemy);
  }
}
