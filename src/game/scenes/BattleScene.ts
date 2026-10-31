import Phaser from 'phaser';
import hero from '../../../public/assets/sprites/main-hero/main-hero.json';
import enemy from '../../../public/assets/sprites/bell-mask-enemy/bell-mask-enemy.json';
import elder from '../../../public/assets/sprites/tutorial-elder/tutorial-elder.json';
import {
  mentorPracticeLevel,
  practiceAllowsAction,
} from '../data/mentorPractice';
import type { Level } from '../data/levels';
import { triviaQuestions, triviaRules } from '../data/combat';
import {
  createBattle,
  resolveTurn,
  resolveTrivia,
  type BattleAction,
  type BattleState,
} from '../systems/battle';
import { progress } from '../state';
import { showBattle, showLevelUnavailable } from '../../ui/shell';
import { clearPracticeSpotlight } from '../../ui/practiceSpotlight';
import { color } from '../theme';
import { BattleFeedback, type FeedbackAction } from '../systems/battleFeedback';

export class BattleScene extends Phaser.Scene {
  private level!: Level;
  private battle!: BattleState;
  private triviaUntil: number | null = null;
  private triviaTimer?: ReturnType<typeof setInterval>;
  private questionIndex = 0;
  private feedback?: BattleFeedback;
  private animating = false;
  private practice = false;
  private practiceStep = 0;
  constructor() {
    super('battle');
  }
  init({
    level,
    practice = false,
  }: {
    level?: Level;
    practice?: boolean;
  }): void {
    this.practice = practice;
    this.practiceStep = 0;
    this.level = practice ? mentorPracticeLevel : level!;
    this.battle = createBattle(this.level);
    if (practice)
      this.battle.log =
        'Arojinle: Let us practise together. Follow each prompt; we will stop after the trivia lesson.';
    this.triviaUntil = null;
    this.questionIndex = 0;
    this.animating = false;
    this.feedback = undefined;
  }
  preload(): void {
    const base = `${import.meta.env.BASE_URL}assets/`;
    if (!this.textures.exists('stage-ground'))
      this.load.image('stage-ground', `${base}maps/stage-1-1/ground.webp`);
    for (const [key, index, folder] of [
      ['hero-atlas', hero, 'main-hero'],
      [
        this.practice ? 'elder-atlas' : 'masquerade-atlas',
        this.practice ? elder : enemy,
        this.practice ? 'tutorial-elder' : 'bell-mask-enemy',
      ],
    ] as const) {
      if (!this.textures.exists(key))
        this.load.spritesheet(key, `${base}sprites/${folder}/${index.image}`, {
          frameWidth: index.frameWidth,
          frameHeight: index.frameHeight,
        });
    }
  }
  create(): void {
    if (
      [
        'stage-ground',
        'hero-atlas',
        this.practice ? 'elder-atlas' : 'masquerade-atlas',
      ].some((key) => !this.textures.exists(key))
    ) {
      showLevelUnavailable(
        () =>
          this.scene.restart({ level: this.level, practice: this.practice }),
        () => this.scene.start(this.practice ? 'stage-1-1' : 'world-map'),
      );
      return;
    }
    const ground = this.add.image(480, 270, 'stage-ground');
    ground.setScale(Math.max(960 / ground.width, 540 / ground.height));
    this.add
      .ellipse(235, 478, 320, 70, color('ink'), 0.16)
      .setStrokeStyle(2, color('gold'), 0.45);
    this.add
      .ellipse(720, 220, 260, 48, color('ink'), 0.13)
      .setStrokeStyle(2, color('gold'), 0.4);
    for (const [key, index, x, y, height] of [
      ['hero', hero, 235, 480, 205],
      [
        this.practice ? 'arojinle' : 'masquerade',
        this.practice ? elder : enemy,
        720,
        220,
        this.practice ? 145 : 185,
      ],
    ] as const) {
      const atlas =
        key === 'hero'
          ? 'hero-atlas'
          : this.practice
            ? 'elder-atlas'
            : 'masquerade-atlas';
      const sprite = this.add
        .sprite(x, y, atlas, 0)
        .setOrigin(
          index.anchor.x / index.frameWidth,
          index.anchor.y / index.frameHeight,
        )
        .setScale(height / index.restBodyHeight)
        .setName(`battle-${key}`);
      const anim = `battle-${key}-idle`;
      if (!this.anims.exists(anim))
        this.anims.create({
          key: anim,
          frames: index.animations.idle.frames.map((frame) => ({
            key: atlas,
            frame,
          })),
          frameRate: index.animations.idle.frameRate,
          repeat: -1,
        });
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
        sprite.play(anim);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      clearPracticeSpotlight();
      this.feedback?.destroy();
      this.feedback = undefined;
      this.animating = false;
      clearInterval(this.triviaTimer);
      this.triviaUntil = null;
    });
    this.feedback = new BattleFeedback(
      this,
      this.children.getByName('battle-hero') as Phaser.GameObjects.Sprite,
      this.children.getByName(
        this.practice ? 'battle-arojinle' : 'battle-masquerade',
      ) as Phaser.GameObjects.Sprite,
    );
    this.render(true);
  }
  private render(first = false): void {
    showBattle(
      this.level,
      this.battle,
      (action) => this.act(action),
      () =>
        this.scene.start(
          this.practice || this.battle.outcome === 'victory'
            ? 'stage-1-1'
            : 'world-map',
        ),
      first,
      () => this.beginTrivia(),
      this.practice
        ? { step: this.practiceStep, complete: this.practiceStep === 4 }
        : undefined,
    );
    this.scale.refresh();
  }
  private finishTurn(next: BattleState): void {
    this.battle = next;
    if (!this.practice && next.outcome === 'victory')
      progress.encounters.add('stage-1-1:encounter-1');
    this.render();
  }
  private act(action: BattleAction): void {
    if (this.triviaUntil !== null || this.animating) return;
    if (this.practice && !practiceAllowsAction(this.practiceStep, action))
      return;
    const next = resolveTurn(this.battle, action, this.level);
    if (next === this.battle) return;
    if (this.practice) this.practiceStep++;
    void this.presentTurn(next, action);
  }
  private async presentTurn(
    next: BattleState,
    action: FeedbackAction,
  ): Promise<void> {
    if (this.animating || next === this.battle) return;
    this.animating = true;
    const console = document.querySelector<HTMLElement>('.battle-console');
    console?.setAttribute('aria-busy', 'true');
    document
      .querySelectorAll<HTMLButtonElement>('.battle-actions button')
      .forEach((button) => {
        button.disabled = true;
      });
    const complete = await this.feedback?.play(
      action,
      this.battle,
      next,
      (phase) => {
        if (console) console.dataset.turnPhase = phase;
        const heading = console?.querySelector('h2');
        if (heading)
          heading.textContent =
            phase === 'hero'
              ? 'Your move…'
              : `${this.level.enemy.name}’s move…`;
      },
    );
    if (!complete || !this.scene.isActive()) return;
    this.animating = false;
    this.finishTurn(next);
    if (
      next.outcome === 'active' &&
      !(this.practice && this.practiceStep === 4)
    )
      document
        .querySelector<HTMLButtonElement>(
          '.battle-actions button:not(:disabled)',
        )
        ?.focus({ preventScroll: true });
  }
  private beginTrivia(): void {
    if (this.practice && this.practiceStep !== 3) return;
    if (
      this.animating ||
      this.triviaUntil !== null ||
      this.battle.outcome !== 'active'
    )
      return;
    const question =
      triviaQuestions[this.questionIndex++ % triviaQuestions.length]!;
    this.triviaUntil = Date.now() + triviaRules.durationMs;
    const actions = document.querySelector<HTMLElement>('.battle-actions')!;
    actions.replaceChildren();
    actions.dataset.menu = 'trivia';
    actions.setAttribute('aria-label', 'Timed trivia');
    const heading = document.createElement('h3');
    heading.textContent = question.prompt;
    heading.tabIndex = -1;
    const timer = document.createElement('p');
    timer.id = 'trivia-time';
    timer.setAttribute('role', 'timer');
    timer.setAttribute('aria-live', 'off');
    const help = document.createElement('p');
    help.className = 'panel-note';
    help.textContent = this.practice
      ? 'Correct: up to +10 SP and practice complete. Wrong, skipped or expired: +0 SP; try again. Arojinle waits while you answer.'
      : 'Correct: up to +10 SP. Wrong, skipped or expired: +0 SP. This uses your turn; the enemy responds.';
    actions.append(heading, timer, help);
    const answer = (choice: number): void => {
      if (this.triviaUntil === null) return;
      const correct =
        Date.now() < this.triviaUntil && choice === question.correct;
      this.triviaUntil = null;
      clearInterval(this.triviaTimer);
      const next = resolveTrivia(
        this.battle,
        correct,
        this.practice
          ? { ...this.level, enemy: { ...this.level.enemy, attack: 0 } }
          : this.level,
      );
      if (this.practice) {
        if (correct) {
          this.practiceStep = 4;
          next.log = `Arojinle: Correct! You restored ${next.playerSp - this.battle.playerSp} SP. You have practised melee, defending, spell casting and trivia. Well done!`;
        } else
          next.log =
            'Arojinle: No SP this time. I will wait while you try another trivia question. Answer correctly to finish, or leave practice whenever you like.';
      }
      void this.presentTurn(next, 'trivia');
    };
    question.answers.forEach((text, i) => {
      const button = document.createElement('button');
      button.className = 'secondary';
      button.textContent = text;
      button.addEventListener('click', () => answer(i));
      actions.append(button);
    });
    const skip = document.createElement('button');
    skip.className = 'secondary';
    skip.textContent = 'Skip question · 0 SP';
    skip.addEventListener('click', () => answer(-1));
    actions.append(skip);
    const tick = (): void => {
      if (this.triviaUntil === null) return;
      const left = this.triviaUntil - Date.now();
      timer.textContent = `${Math.max(0, Math.ceil(left / 1000))} seconds remaining`;
      if (left <= 0) answer(-1);
    };
    tick();
    this.triviaTimer = setInterval(tick, 200);
    heading.focus({ preventScroll: true });
  }
}
