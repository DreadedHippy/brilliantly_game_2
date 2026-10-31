import {
  heroLoadout,
  starterSpells,
  spells,
  triviaRules,
} from '../game/data/combat';
import type { Level } from '../game/data/levels';
import {
  clearPracticeSpotlight,
  mountPracticeSpotlight,
} from './practiceSpotlight';
import {
  mentorPracticeSteps,
  practiceAllowsAction,
  type PracticeGuide,
} from '../game/data/mentorPractice';
import { animateBattleMeters, type BattleMeterSnapshot } from './battleMeters';
import {
  PLAYER_MAX_HP,
  PLAYER_MAX_SP,
  type BattleAction,
  type BattleState,
} from '../game/systems/battle';

/** Battle-only presentation: split status plates and a manual two-by-two command menu. */
export function renderBattleInterface(
  level: Level,
  state: BattleState,
  onAction: (action: BattleAction) => void,
  onLeave: () => void,
  onTrivia: () => void,
  previousMeters: BattleMeterSnapshot = {},
  practice?: PracticeGuide,
): void {
  const host = document.querySelector<HTMLElement>('#game')!;
  host.setAttribute(
    'aria-label',
    `Battlefield. Hero and ${level.enemy.name} status. Choose actions in the battle command box below.`,
  );
  const panel = document.querySelector<HTMLElement>('#panel')!;
  host.querySelector('.battle-hud')?.remove();
  const hud = document.createElement('div');
  hud.className = 'battle-hud';
  hud.innerHTML = `
    <section class="combat-status combat-status-enemy" aria-label="Enemy status"><div class="combat-name"><strong>${level.enemy.name}</strong><span>${practice ? 'Practice partner' : 'Encounter 1'}</span></div><label for="enemy-health">HP <span>${state.enemyHp} / ${level.enemy.maxHp}</span></label><meter id="enemy-health" min="0" max="${level.enemy.maxHp}" value="${state.enemyHp}"></meter></section>
    <section class="combat-status combat-status-hero" aria-label="Hero status"><div class="combat-name"><strong>Hero</strong><span>Lv. 1</span></div><label for="player-health">HP <span>${state.playerHp} / ${PLAYER_MAX_HP}</span></label><meter id="player-health" min="0" max="${PLAYER_MAX_HP}" value="${state.playerHp}"></meter><label for="player-sp">SP <span>${state.playerSp} / ${PLAYER_MAX_SP}</span></label><meter id="player-sp" min="0" max="${PLAYER_MAX_SP}" value="${state.playerSp}"></meter></section>`;
  host.append(hud);
  animateBattleMeters(hud, previousMeters);
  panel.innerHTML = `
    <div class="battle-console" aria-busy="false" data-turn-phase="idle"><section class="battle-message"><p class="eyebrow">${practice ? (practice.complete ? 'Guided practice · Complete' : `Guided practice · Step ${practice.step + 1} of 4`) : `Round ${state.round}`}</p><h2 tabindex="-1">${practice?.complete ? 'Practice complete' : state.outcome === 'victory' ? `${level.enemy.name} defeated` : state.outcome === 'defeat' ? 'You have fallen' : practice ? mentorPracticeSteps[practice.step]!.title : 'What will you do?'}</h2><p class="battle-log"></p></section><div class="battle-actions" role="group" aria-label="Battle commands"></div></div>
    <div class="battle-utility"><p>${heroLoadout.weapon.name} · Lv. ${heroLoadout.weapon.level} · No shield</p></div>
    <details class="spell-codex"><summary>Spell catalogue · 4 available / ${spells.length} total</summary><p class="panel-note">Affinities label base damage; later tiers are locked.</p><div class="spell-list"></div></details>`;
  panel.querySelector('.battle-log')!.textContent = state.log;
  if (practice && !practice.complete) {
    const prompt = document.createElement('p');
    prompt.id = 'practice-instruction';
    prompt.className = 'practice-instruction';
    prompt.textContent = mentorPracticeSteps[practice.step]!.prompt;
    panel.querySelector('.battle-message')!.append(prompt);
  }
  const leave = document.createElement('button');
  leave.type = 'button';
  leave.id = 'return-map';
  leave.className = 'secondary';
  leave.textContent = practice
    ? practice.complete
      ? 'Return to the trail'
      : 'Leave practice'
    : state.outcome === 'victory'
      ? 'Return to the trail'
      : 'Return to map';
  leave.addEventListener('click', onLeave);
  panel.querySelector('.battle-utility')!.append(leave);
  const actions = panel.querySelector<HTMLElement>('.battle-actions')!;
  const command = (
    name: string,
    detail: string,
    handler: () => void,
  ): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'battle-command';
    const title = document.createElement('strong');
    title.textContent = name;
    const copy = document.createElement('span');
    copy.textContent = detail;
    button.append(title, copy);
    button.addEventListener('click', handler);
    actions.append(button);
    return button;
  };
  const showSpells = (): void => {
    if (practice && practice.step !== 2) return;
    actions.replaceChildren();
    actions.dataset.menu = 'spells';
    actions.setAttribute('aria-label', 'Choose a spell');
    for (const spell of starterSpells) {
      const button = command(
        spell.name,
        `${spell.element} · ${spell.damage} damage · ${spell.spCost} SP`,
        () => onAction(`spell:${spell.id}`),
      );
      button.dataset.action = `spell:${spell.id}`;
      button.dataset.element = spell.element;
      button.disabled = spell.spCost > state.playerSp;
      if (button.disabled)
        button.title = `Needs ${spell.spCost} SP; you have ${state.playerSp}.`;
    }
    command('Back', 'Return to commands · no turn cost', () => {
      showCommands();
      actions.querySelector<HTMLButtonElement>('[data-menu-open]')?.focus();
    }).classList.add('battle-back');
    actions
      .querySelector<HTMLButtonElement>('button:not(:disabled)')
      ?.focus({ preventScroll: true });
  };
  const showCommands = (): void => {
    actions.replaceChildren();
    actions.dataset.menu = 'commands';
    actions.setAttribute('aria-label', 'Battle commands');
    command('Fight', `Melee · ${heroLoadout.weapon.damage} damage · 0 SP`, () =>
      onAction('attack'),
    ).dataset.action = 'attack';
    command(
      'Spells',
      'Choose an elemental skill',
      showSpells,
    ).dataset.menuOpen = 'spells';
    command('Defend', 'Halve the next hit · 0 SP', () =>
      onAction('guard'),
    ).dataset.action = 'guard';
    command(
      'Trivia',
      `Restore SP · up to ${triviaRules.spReward} SP`,
      onTrivia,
    ).dataset.guideAction = 'trivia-command';
    if (practice) {
      for (const button of actions.querySelectorAll<HTMLButtonElement>(
        'button',
      )) {
        const action = button.dataset.action as BattleAction | undefined;
        button.disabled = action
          ? !practiceAllowsAction(practice.step, action)
          : button.dataset.menuOpen
            ? practice.step !== 2
            : practice.step !== 3;
        if (!button.disabled)
          button.setAttribute('aria-describedby', 'practice-instruction');
      }
    }
  };
  if (state.outcome === 'active' && !practice?.complete) showCommands();
  else
    command(
      practice?.complete || state.outcome === 'victory'
        ? 'Continue'
        : 'Return to map',
      practice?.complete || state.outcome === 'victory'
        ? 'Return to the trail'
        : 'Rest and try again',
      onLeave,
    );
  panel.querySelector('.battle-console')!.addEventListener('keydown', (raw) => {
    const event = raw as KeyboardEvent;
    if (event.key === 'Escape' && actions.dataset.menu === 'spells') {
      event.preventDefault();
      showCommands();
      actions.querySelector<HTMLButtonElement>('[data-menu-open]')?.focus();
      return;
    }
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    )
      return;
    const buttons = [
      ...actions.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    ];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const offset =
      event.key === 'ArrowLeft'
        ? -1
        : event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp'
            ? -2
            : 2;
    buttons[
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + offset + buttons.length) % buttons.length
    ]?.focus();
  });
  for (const spell of spells) {
    const item = document.createElement('p');
    item.className = 'panel-note';
    item.textContent = `${spell.name} — ${spell.element} · ${spell.damage} damage · ${spell.spCost} SP · ${heroLoadout.starterSpellIds.includes(spell.id) ? 'Available' : `Locked · tier ${spell.tier}`}`;
    panel.querySelector('.spell-list')!.append(item);
  }
  if (practice && !practice.complete) mountPracticeSpotlight(panel);
  else clearPracticeSpotlight();
}
