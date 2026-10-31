import Phaser from 'phaser';
import hero from '../../../public/assets/sprites/main-hero/main-hero.json';
import elder from '../../../public/assets/sprites/tutorial-elder/tutorial-elder.json';
import directions from '../../../public/assets/sprites/main-hero/directions/directions.json';
import environment from '../../../public/assets/maps/stage-1-1/environment.json';
import masqueradeSprite from '../../../public/assets/sprites/bell-mask-enemy/bell-mask-enemy.json';
import { levels } from '../data/levels';
import { progress } from '../state';
import {
  stageOne,
  stageOneTrail,
  type SpriteIndex,
  type EnvironmentProp,
} from '../data/stageOne';
import {
  followTrailCamera,
  projectToTrail,
  type Point,
} from '../systems/trail';
import {
  WorldNavigator,
  stepInWorld,
  type WorldObstacle,
} from '../systems/worldMovement';
import { ActorVisibility } from '../systems/actorVisibility';
import { color, palette } from '../theme';
import {
  showLevelUnavailable,
  showStageLoading,
  showStageOne,
  updateTrailProgress,
  setMentorAvailable,
} from '../../ui/shell';
import { mountStageControls } from '../../ui/stageControls';
import { mountMentorLesson } from '../../ui/mentorLesson';

export class StageOneScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Sprite;
  private mentor?: Phaser.GameObjects.Sprite;
  private shadow?: Phaser.GameObjects.Ellipse;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private route: Point[] = [];
  private touch: Point = { x: 0, y: 0 };
  private running = false;
  private cameraFocus: Point = { x: 0, y: 0 };
  private progressReached = 0;
  private previousUI = '';
  private reducedMotion = false;
  private facing: 'side' | 'up' | 'down' = 'side';
  private navigator?: WorldNavigator;
  private obstacles: WorldObstacle[] = [];
  private visibility?: ActorVisibility;
  private lesson?: ReturnType<typeof mountMentorLesson>;
  private lessonActive = false;

  constructor() {
    super('stage-1-1');
  }

  init(): void {
    this.player = undefined;
    this.mentor = undefined;
    this.shadow = undefined;
    this.route = [];
    this.touch = { x: 0, y: 0 };
    this.running = false;
    this.progressReached = 0;
    this.previousUI = '';
    this.facing = 'side';
    this.navigator = undefined;
    this.obstacles = [];
    this.visibility = undefined;
    this.lessonActive = false;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    showStageLoading(() => this.scene.start('world-map'));
  }

  preload(): void {
    const base = `${import.meta.env.BASE_URL}assets/`;
    if (!this.textures.exists('stage-ground'))
      this.load.image('stage-ground', `${base}maps/stage-1-1/ground.webp`);
    for (const [name, index, folder] of [
      ['hero', hero, 'main-hero'],
      ['elder', elder, 'tutorial-elder'],
      ['masquerade', masqueradeSprite, 'bell-mask-enemy'],
    ] as const) {
      if (!this.textures.exists(`${name}-atlas`))
        this.load.spritesheet(
          `${name}-atlas`,
          `${base}sprites/${folder}/${index.image}`,
          { frameWidth: index.frameWidth, frameHeight: index.frameHeight },
        );
    }
    for (const asset of environment.assets) {
      if (!this.textures.exists(asset.texture))
        this.load.image(asset.texture, `${base}maps/stage-1-1/${asset.image}`);
    }
    for (const [direction, index] of Object.entries(directions.directions)) {
      if (!this.textures.exists(`hero-${direction}-atlas`))
        this.load.spritesheet(
          `hero-${direction}-atlas`,
          `${base}sprites/main-hero/directions/${index.image}`,
          {
            frameWidth: directions.frameWidth,
            frameHeight: directions.frameHeight,
          },
        );
    }
  }

  create(): void {
    const requiredTextures = [
      'hero-up-atlas',
      'hero-down-atlas',
      'stage-ground',
      'hero-atlas',
      'elder-atlas',
      'masquerade-atlas',
      ...environment.assets.map((asset) => asset.texture),
    ];
    if (requiredTextures.some((key) => !this.textures.exists(key))) {
      showLevelUnavailable(
        () => this.scene.restart(),
        () => this.scene.start('world-map'),
      );
      return;
    }
    const camera = this.cameras.main;
    camera.setOrigin(0.5, 0.5).setZoom(stageOne.camera.zoom);
    camera.setBounds(0, 0, stageOne.world.width, stageOne.world.height);
    this.add.image(0, 0, 'stage-ground').setOrigin(0).setDepth(-100);
    const trees: Phaser.GameObjects.Image[] = [];
    for (const prop of environment.props as EnvironmentProp[]) {
      const image = this.add
        .image(prop.x, prop.y, prop.texture)
        .setName(prop.id);
      image
        .setOrigin(prop.anchor.x, prop.anchor.y)
        .setScale(prop.height / prop.sourceHeight)
        .setDepth(prop.y);
      if (prop.texture === 'stage-baobab' || prop.texture === 'stage-acacia')
        trees.push(image);
      if (prop.radius)
        this.obstacles.push({ x: prop.x, y: prop.y, radius: prop.radius });
    }
    this.obstacles.push(stageOne.npc);
    this.navigator = new WorldNavigator(
      stageOne.navigation.bounds,
      this.obstacles,
      stageOne.player.radius,
    );
    this.registerAnimations('hero', hero);
    this.registerAnimations('elder', elder);
    this.registerAnimations('masquerade', masqueradeSprite);
    for (const [direction, index] of Object.entries(directions.directions))
      for (const action of ['walk', 'run'] as const) {
        const key = `hero-${action}-${direction}`,
          clip = index[action];
        if (!this.anims.exists(key))
          this.anims.create({
            key,
            frames: clip.frames.map((frame) => ({
              key: `hero-${direction}-atlas`,
              frame,
            })),
            frameRate: clip.frameRate,
            repeat: clip.repeat,
          });
      }
    this.add
      .ellipse(stageOne.npc.x, stageOne.npc.y - 3, 43, 12, color('ink'), 0.2)
      .setDepth(0);
    this.mentor = this.add
      .sprite(stageOne.npc.x, stageOne.npc.y, 'elder-atlas', 0)
      .setOrigin(
        elder.anchor.x / elder.frameWidth,
        elder.anchor.y / elder.frameHeight,
      )
      .setScale(stageOne.npc.height / elder.restBodyHeight)
      .setDepth(stageOne.npc.y)
      .setName('stage-mentor');
    if (!this.reducedMotion) this.mentor.play('elder-idle');
    this.label(
      stageOne.npc.x,
      stageOne.npc.y - stageOne.npc.height - 20,
      `${stageOne.npc.name} · Mentor`,
    );
    this.shadow = this.add
      .ellipse(
        stageOne.player.x,
        stageOne.player.y - 3,
        31,
        10,
        color('ink'),
        0.2,
      )
      .setDepth(0);
    this.player = this.add
      .sprite(stageOne.player.x, stageOne.player.y, 'hero-atlas', 0)
      .setOrigin(
        hero.anchor.x / hero.frameWidth,
        hero.anchor.y / hero.frameHeight,
      )
      .setScale(stageOne.player.height / hero.restBodyHeight)
      .setDepth(stageOne.player.y)
      .setName('stage-player');
    this.playHero('idle');
    this.visibility = new ActorVisibility(this, this.player, trees);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.lesson?.destroy();
      this.lesson = undefined;
      this.visibility?.destroy();
      this.visibility = undefined;
    });
    for (const encounter of stageOne.encounters) {
      if (
        encounter.id === 'encounter-1' &&
        !progress.encounters.has('stage-1-1:encounter-1')
      ) {
        const enemy = this.add
          .sprite(encounter.x, encounter.y, 'masquerade-atlas', 0)
          .setOrigin(
            masqueradeSprite.anchor.x / masqueradeSprite.frameWidth,
            masqueradeSprite.anchor.y / masqueradeSprite.frameHeight,
          )
          .setScale(110 / masqueradeSprite.restBodyHeight)
          .setDepth(encounter.y)
          .setName('stage-masquerade');
        if (!this.reducedMotion) enemy.play('masquerade-idle');
      }
      this.add
        .circle(encounter.x, encounter.y, 17, color('ink'), 0.08)
        .setStrokeStyle(1, color('ink'), 0.35)
        .setDepth(-1);
      this.label(
        encounter.x,
        encounter.y - 130,
        encounter.id === 'encounter-1'
          ? progress.encounters.has('stage-1-1:encounter-1')
            ? 'Encounter 1 · Cleared'
            : 'Encounter 1 · Masquerade'
          : encounter.name,
      );
    }
    this.label(
      stageOne.exit.x,
      stageOne.exit.y - 125,
      'Next trail · Stage 1-2',
    );
    this.cameraFocus = followTrailCamera(
      { x: this.player.x, y: this.player.y - 45 },
      this.player,
      0,
      stageOne.world,
      { width: 960 / camera.zoom, height: 540 / camera.zoom },
      stageOne.camera.deadzone,
      stageOne.camera.followRate,
    );
    camera.centerOn(this.cameraFocus.x, this.cameraFocus.y);
    this.lesson = mountMentorLesson(
      () => {
        this.lessonActive = true;
        this.route = [];
        this.touch = { x: 0, y: 0 };
        this.running = false;
        this.input.keyboard?.resetKeys();
        if (this.input.keyboard) this.input.keyboard.enabled = false;
        this.playHero('idle');
      },
      () => {
        this.lessonActive = false;
        this.input.keyboard?.resetKeys();
        if (this.input.keyboard) this.input.keyboard.enabled = true;
      },
      () => this.scene.start('battle', { practice: true }),
    );
    showStageOne(
      () => this.scene.start('world-map'),
      () => this.talkToMentor(),
      () => this.beginEncounter(),
    );
    this.bindControls();
    this.refreshUI();
  }

  private registerAnimations(name: string, index: SpriteIndex): void {
    for (const [action, clip] of Object.entries(index.animations)) {
      const key = `${name}-${action}`;
      if (!this.anims.exists(key))
        this.anims.create({
          key,
          frames: clip.frames.map((frame) => ({ key: `${name}-atlas`, frame })),
          frameRate: clip.frameRate,
          repeat: clip.repeat,
        });
    }
  }

  private besideMentor(): boolean {
    return (
      !!this.player &&
      Math.hypot(
        this.player.x - stageOne.npc.x,
        this.player.y - stageOne.npc.y,
      ) < 125
    );
  }

  private talkToMentor(): void {
    if (this.besideMentor()) this.lesson?.open();
  }

  private encounterReady(): boolean {
    const enemy = stageOne.encounters[0]!;
    return (
      !progress.encounters.has('stage-1-1:encounter-1') &&
      !!this.player &&
      Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) < 135
    );
  }
  private beginEncounter(): void {
    if (this.encounterReady() && !this.lessonActive)
      this.scene.start('battle', { level: levels[0]! });
  }

  private label(x: number, y: number, text: string): void {
    this.add
      .text(x, y, text, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '13px',
        color: palette.text,
        backgroundColor: palette.ink,
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10000);
  }

  private bindControls(): void {
    const keyboard = this.input.keyboard;
    const host = document.querySelector<HTMLElement>('#game');
    if (!keyboard || !host) return;
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,S,D') as typeof this.keys;
    keyboard.removeCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'SHIFT']);
    const cleanupControls = mountStageControls(
      host,
      (point) => {
        this.touch = point;
        this.route = [];
      },
      (run) => {
        this.running = run;
      },
    );
    const pointers = new Map<number, Point>();
    let multiTouch = false;
    const down = (event: PointerEvent): void => {
      if (!(event.target instanceof HTMLCanvasElement) || event.button !== 0)
        return;
      host.focus({ preventScroll: true });
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size > 1) {
        multiTouch = true;
        this.route = [];
      }
    };
    const up = (event: PointerEvent): void => {
      const origin = pointers.get(event.pointerId);
      pointers.delete(event.pointerId);
      if (
        origin &&
        !multiTouch &&
        this.player &&
        Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < 14
      ) {
        const canvas = this.game.canvas.getBoundingClientRect();
        const point = this.cameras.main.getWorldPoint(
          ((event.clientX - canvas.left) * 960) / canvas.width,
          ((event.clientY - canvas.top) * 540) / canvas.height,
        );
        const mentorPoint = this.mentor
          ?.getWorldTransformMatrix()
          .applyInverse(point.x, point.y);
        const mentorHit =
          this.mentor &&
          mentorPoint &&
          (this.textures.getPixelAlpha(
            Math.floor(mentorPoint.x + this.mentor.displayOriginX),
            Math.floor(mentorPoint.y + this.mentor.displayOriginY),
            this.mentor.texture.key,
            this.mentor.frame.name,
          ) ?? 0) > 32;
        if (this.besideMentor() && mentorHit) {
          this.talkToMentor();
          if (!pointers.size) multiTouch = false;
          return;
        }
        this.route = this.navigator?.route(this.player, point) ?? [];
      }
      if (!pointers.size) multiTouch = false;
    };
    const cancel = (event: PointerEvent): void => {
      pointers.delete(event.pointerId);
      if (!pointers.size) multiTouch = false;
    };
    const preventScroll = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'e' && !event.repeat) {
        if (this.besideMentor()) this.talkToMentor();
        else this.beginEncounter();
      }
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
          event.key,
        )
      )
        event.preventDefault();
    };
    const wheel = (event: WheelEvent): void => {
      event.preventDefault();
    };
    const stop = (): void => {
      this.route = [];
      this.touch = { x: 0, y: 0 };
      this.running = false;
      host
        .querySelector('.level-controls [aria-pressed]')
        ?.setAttribute('aria-pressed', 'false');
      keyboard.resetKeys();
      pointers.clear();
    };
    const focus = (event: FocusEvent): void => {
      if (
        !(event.relatedTarget instanceof Node) ||
        !host.contains(event.relatedTarget)
      )
        stop();
    };
    const visibility = (): void => {
      if (document.hidden) stop();
    };
    host.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    host.addEventListener('keydown', preventScroll);
    host.addEventListener('wheel', wheel, { passive: false });
    host.addEventListener('focusout', focus);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', visibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cleanupControls();
      keyboard.resetKeys();
      host.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      host.removeEventListener('keydown', preventScroll);
      host.removeEventListener('wheel', wheel);
      host.removeEventListener('focusout', focus);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', visibility);
    });
  }

  update(_time: number, delta: number): void {
    if (this.lessonActive || !this.player || !this.cursors || !this.keys)
      return;
    const host = document.querySelector('#game');
    const focused = host?.contains(document.activeElement) ?? false;
    const seconds = Math.min(delta, 100) / 1000;
    let x = 0,
      y = 0;
    if (focused) {
      x =
        Number(this.cursors.right.isDown || this.keys.D.isDown) -
        Number(this.cursors.left.isDown || this.keys.A.isDown) +
        this.touch.x;
      y =
        Number(this.cursors.down.isDown || this.keys.S.isDown) -
        Number(this.cursors.up.isDown || this.keys.W.isDown) +
        this.touch.y;
    }
    if (x || y) this.route = [];
    let speed =
      this.running || this.cursors.shift.isDown
        ? stageOne.player.runSpeed
        : stageOne.player.walkSpeed;
    while (
      this.route.length &&
      Math.hypot(
        this.route[0]!.x - this.player.x,
        this.route[0]!.y - this.player.y,
      ) < 7
    )
      this.route.shift();
    if (focused && !x && !y && this.route.length) {
      x = this.route[0]!.x - this.player.x;
      y = this.route[0]!.y - this.player.y;
      speed = Math.min(speed, Math.hypot(x, y) / Math.max(seconds, 0.001));
    }
    const length = Math.hypot(x, y);
    const direction = {
      x: length ? x / length : 0,
      y: length ? y / length : 0,
    };
    const oldX = this.player.x,
      oldY = this.player.y;
    const next = stepInWorld(
      this.player,
      direction,
      speed,
      seconds,
      stageOne.navigation.bounds,
      this.obstacles,
      stageOne.player.radius,
    );
    const moved =
      Math.hypot(next.x - this.player.x, next.y - this.player.y) > 0.02;
    this.player.setPosition(next.x, next.y).setDepth(next.y);
    this.shadow?.setPosition(next.x, next.y - 3);
    if (moved) {
      const dx = next.x - oldX,
        dy = next.y - oldY;
      const vertical =
        Math.abs(dy) > Math.abs(dx) * (this.facing === 'side' ? 1.1 : 0.9);
      this.facing = vertical ? (dy < 0 ? 'up' : 'down') : 'side';
      if (this.facing === 'side' && Math.abs(dx) > 0.02)
        this.player.setFlipX(dx < 0);
    }
    this.playHero(
      moved
        ? this.running || this.cursors.shift.isDown
          ? 'run'
          : 'walk'
        : 'idle',
    );
    this.visibility?.update();
    const camera = this.cameras.main;
    this.cameraFocus = followTrailCamera(
      this.cameraFocus,
      {
        x: next.x + direction.x * stageOne.camera.lookAhead,
        y: next.y - 45 + direction.y * 20,
      },
      seconds,
      stageOne.world,
      { width: 960 / camera.zoom, height: 540 / camera.zoom },
      stageOne.camera.deadzone,
      stageOne.camera.followRate,
    );
    camera.centerOn(this.cameraFocus.x, this.cameraFocus.y);
    this.refreshUI();
  }

  private playHero(action: 'idle' | 'walk' | 'run'): void {
    if (!this.player) return;
    if (this.facing !== 'side') {
      const direction = this.facing,
        texture = `hero-${direction}-atlas`;
      this.player.setFlipX(false);
      if (action === 'idle') {
        this.player.anims.stop();
        const neutral = directions.directions[direction].neutralFrame;
        if (
          this.player.texture.key !== texture ||
          this.player.frame.name !== String(neutral)
        )
          this.player.setTexture(texture, neutral);
      } else this.player.play(`hero-${action}-${direction}`, true);
      return;
    }
    if (action === 'idle' && this.reducedMotion) {
      this.player.anims.stop();
      this.player.setFrame(0);
    } else this.player.play(`hero-${action}`, true);
  }

  private refreshUI(): void {
    if (!this.player) return;
    const challenge = document.querySelector<HTMLButtonElement>(
      '#challenge-masquerade',
    );
    if (challenge) {
      const won = progress.encounters.has('stage-1-1:encounter-1');
      challenge.disabled = !this.encounterReady();
      challenge.textContent = won
        ? 'Encounter 1 cleared'
        : this.encounterReady()
          ? 'Challenge Masquerade · E'
          : 'Approach encounter 1';
    }
    const distance = projectToTrail(this.player, stageOneTrail).distance;
    const end = projectToTrail(stageOne.exit, stageOneTrail).distance;
    const start = projectToTrail(stageOne.player, stageOneTrail).distance;
    this.progressReached = Math.max(
      this.progressReached,
      Math.max(
        0,
        Math.min(100, Math.round(((distance - start) / (end - start)) * 100)),
      ),
    );
    const besideMentor = this.besideMentor();
    setMentorAvailable(besideMentor);
    const reachedEnd =
      Math.hypot(
        this.player.x - stageOne.exit.x,
        this.player.y - stageOne.exit.y,
      ) < 85;
    const status = reachedEnd
      ? 'You reached the ridge. The next trail is not open yet.'
      : besideMentor
        ? `${stageOne.npc.name} is ready to teach you. Press E or choose Talk to Arojinle.`
        : distance < 750
          ? 'Explore the starting grove.'
          : distance < 2100
            ? 'Explore the low pass and the surrounding savanna.'
            : 'Climb toward the higher ridge.';
    const signature = `${this.progressReached}:${status}`;
    if (signature !== this.previousUI) {
      updateTrailProgress(this.progressReached, status);
      this.previousUI = signature;
    }
  }
}
