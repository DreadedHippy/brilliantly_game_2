import type { BattleAction, BattleState } from '../game/systems/battle';
import { renderBattleInterface } from './battleInterface';
import { captureBattleMeters } from './battleMeters';
import type { PracticeGuide } from '../game/data/mentorPractice';
import { clearPracticeSpotlight } from './practiceSpotlight';
import { isLevelUnlocked, levels, type Level } from '../game/data/levels';

function required<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

export function mountShell(): void {
  required('#app').innerHTML = `
    <main class="shell">
      <header class="masthead">
        <a class="wordmark" href="./" aria-label="Brilliantly home"><span aria-hidden="true">✦</span> brilliantly</a>
        <span class="build-label">Journey prototype · v0.1</span>
      </header>
      <div class="intro"><p class="eyebrow">A world taking shape</p><h1>Every journey starts somewhere.</h1><p>Choose a path. Find your footing. Take your turn.</p></div>
      <section class="game-layout" aria-label="Adventure prototype">
        <div class="stage-wrap">
          <div class="stage-heading"><span id="scene-label">World map</span><span id="progress-label">0 / 3 encounters</span></div>
          <div id="game" tabindex="0" role="region" aria-label="Game world. Use arrow keys or W A S D to move during exploration." aria-describedby="controls-help"></div>
          <p id="controls-help" class="stage-help">Choose a destination from the journey panel.</p>
        </div>
        <aside class="journey-panel" aria-label="Journey controls"><div id="panel"></div></aside>
      </section>
      <footer><span>African-inspired adventure · early development</span><span>A fictional world, waiting to be explored</span></footer>
      <p class="sr-only" id="announcement" role="status" aria-live="polite" aria-atomic="true"></p>
    </main>`;
}

function sceneHeading(label: string, help: string): void {
  clearPracticeSpotlight();
  required('#game').setAttribute(
    'aria-label',
    'Game world. Use arrow keys or W A S D to move during exploration.',
  );
  document.querySelector('.game-layout')?.classList.remove('is-battle');
  document.querySelector('.battle-hud')?.remove();
  document.title = `${label} · Brilliantly`;
  required('#scene-label').textContent = label;
  required('#controls-help').textContent = help;
}

function focusPanel(): void {
  required<HTMLElement>('#panel h2').focus({ preventScroll: true });
}

export function announce(message: string): void {
  required('#announcement').textContent = message;
}

export function showMap(
  completed: ReadonlySet<string>,
  onEnter: (level: Level) => void,
): void {
  sceneHeading(
    'World map',
    'Scroll or pinch to zoom. Drag to pan. Keyboard: arrows to pan, + / − to zoom, Home to reset. Choose a gold level to explore.',
  );
  required('#progress-label').textContent =
    `${completed.size} / ${levels.length} encounters`;
  required('#panel').innerHTML =
    `<p class="eyebrow">Your journey</p><h2 tabindex="-1">The first route</h2><p class="panel-copy">Three places to begin exploring this world.</p><div class="destinations"></div><p class="panel-note">Progress lasts for this session. Refreshing starts a new journey.</p>`;
  levels.forEach((level, index) => {
    const unlocked = isLevelUnlocked(index, completed);
    const button = document.createElement('button');
    button.className = 'destination';
    button.dataset.regionId = level.id;
    button.disabled = !unlocked;
    const status = completed.has(level.id)
      ? 'Complete · revisit'
      : unlocked
        ? 'Explore →'
        : 'Complete the previous encounter to unlock';
    button.innerHTML = `<span class="route-number">0${index + 1}</span><span><strong>${level.name}</strong><small>${status}</small></span>`;
    button.addEventListener('click', () => onEnter(level));
    required('.destinations').append(button);
  });
  focusPanel();
}

export function showExploration(
  level: Level,
  onBattle: () => void,
  onMap: () => void,
): void {
  sceneHeading(
    level.name,
    'Move: arrow keys / WASD, or tap a spot on the ground. Approach the sentinel, then press E.',
  );
  required('#panel').innerHTML =
    `<p class="eyebrow">Explore</p><h2 tabindex="-1">${level.name}</h2><p class="panel-copy">${level.description}</p><div class="objective"><span class="objective-dot" aria-hidden="true"></span><p>Walk toward the gold marker to begin your encounter.</p></div><button class="primary" id="start-battle" disabled>Approach the sentinel</button><button class="secondary" id="return-map">Return to map</button><p class="panel-note">Click or tap the ground to move. You can also use your keyboard.</p>`;
  required('#start-battle').addEventListener('click', onBattle);
  required('#return-map').addEventListener('click', onMap);
  required('#game').focus({ preventScroll: true });
}

export function setBattleReady(ready: boolean): void {
  const button = required<HTMLButtonElement>('#start-battle');
  if (button.disabled === !ready) return;
  button.disabled = !ready;
  button.textContent = ready ? 'Begin encounter' : 'Approach the sentinel';
  if (ready) announce('Sentinel reached. Press E or choose Begin encounter.');
}

export function showStageOne(
  onMap: () => void,
  onTalk: () => void,
  onEncounter: () => void,
): void {
  sceneHeading(
    'Stage 1-1 · The first trail',
    'Move: WASD / arrows or tap the terrain. Hold Shift to run. Explore freely; the camera follows at a fixed distance.',
  );
  required('#progress-label').textContent = 'Stage 1-1';
  required('#panel').innerHTML =
    `<p class="eyebrow">Stage 1 · Level 1</p><h2 tabindex="-1">The first trail</h2><p class="panel-copy">Walk freely across the savanna, or follow the winding trail. Find Arojinle in the starting grove, explore the low pass, and make your way to the ridge.</p><div class="objective"><span class="objective-dot" aria-hidden="true"></span><p id="trail-status">Explore the starting grove.</p></div><label class="health-label" for="trail-progress">Journey progress <span id="trail-percent">0%</span></label><progress id="trail-progress" max="100" value="0"></progress><div class="stage-route"><span>Starting grove</span><span>Low pass</span><span>Higher ridge</span></div><button class="primary" id="talk-mentor" disabled aria-describedby="mentor-help">Talk to Arojinle</button><p class="panel-note" id="mentor-help">Approach Arojinle, then press E, tap him, or choose Talk to Arojinle to learn the battle basics.</p><button class="secondary" id="return-map">Return to map</button><p class="panel-note">Encounter 1: Masquerade. Approach and press E or choose Challenge Masquerade. Encounters 2-4 are not open yet.</p>`;
  required('#talk-mentor').addEventListener('click', onTalk);
  const challenge = document.createElement('button');
  challenge.id = 'challenge-masquerade';
  challenge.className = 'primary';
  challenge.disabled = true;
  challenge.textContent = 'Approach encounter 1';
  challenge.addEventListener('click', onEncounter);
  required('#panel').insertBefore(challenge, required('#return-map'));
  required('#return-map').addEventListener('click', onMap);
  required('#game').focus({ preventScroll: true });
}

export function setMentorAvailable(available: boolean): void {
  required<HTMLButtonElement>('#talk-mentor').disabled = !available;
}

export function showStageLoading(onMap: () => void): void {
  sceneHeading('Stage 1-1', 'Loading the trail and characters.');
  required('#progress-label').textContent = 'Stage 1-1';
  required('#panel').innerHTML =
    `<p class="eyebrow">Stage 1 · Level 1</p><h2 tabindex="-1">Entering the first trail</h2><p class="panel-copy" role="status">Loading the trail and characters…</p><progress class="level-loading" aria-label="Loading Stage 1-1"></progress><button class="secondary" id="return-map">Return to map</button>`;
  required('#return-map').addEventListener('click', onMap);
  focusPanel();
}

export function updateTrailProgress(percent: number, status: string): void {
  required<HTMLProgressElement>('#trail-progress').value = percent;
  required('#trail-percent').textContent = `${percent}%`;
  const message = required('#trail-status');
  if (message.textContent !== status) {
    message.textContent = status;
    announce(status);
  }
}

export function showLevelUnavailable(
  onRetry: () => void,
  onMap: () => void,
): void {
  sceneHeading(
    'Stage 1-1',
    'The level could not load. Retry or return to the world map.',
  );
  required('#panel').innerHTML =
    `<p class="eyebrow">Stage 1-1</p><h2 tabindex="-1">Level unavailable</h2><p class="panel-copy" role="alert">Some level artwork could not load. Check your connection and retry.</p><button class="primary" id="retry-level">Retry level</button><button class="secondary" id="return-map">Return to map</button>`;
  required('#retry-level').addEventListener('click', onRetry);
  required('#return-map').addEventListener('click', onMap);
  focusPanel();
}

export function showBattle(
  level: Level,
  state: BattleState,
  onAction: (action: BattleAction) => void,
  onMap: () => void,
  firstRender = false,
  onTrivia: () => void = () => {},
  practice?: PracticeGuide,
): void {
  const previousMeters = captureBattleMeters();
  sceneHeading(
    practice ? 'Practice · Arojinle' : 'Encounter 1 · Masquerade',
    'Choose a command. Use the arrow keys to move between commands; Escape goes back from Spells.',
  );
  document.querySelector('.game-layout')?.classList.add('is-battle');
  renderBattleInterface(
    level,
    state,
    onAction,
    onMap,
    onTrivia,
    previousMeters,
    practice,
  );
  announce(state.log);
  if (firstRender || state.outcome !== 'active' || practice?.complete)
    focusPanel();
}
