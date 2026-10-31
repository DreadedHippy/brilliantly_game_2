import type { Level } from '../data/levels';
import { heroLoadout, starterSpells, triviaRules } from '../data/combat';
export type BattleAction = 'attack' | 'guard' | `spell:${string}`;
export interface BattleState {
  playerHp: number;
  playerSp: number;
  enemyHp: number;
  round: number;
  outcome: 'active' | 'victory' | 'defeat';
  log: string;
}
export const PLAYER_MAX_HP = heroLoadout.maxHp;
export const PLAYER_MAX_SP = heroLoadout.maxSp;
export function createBattle(level: Level): BattleState {
  return {
    playerHp: PLAYER_MAX_HP,
    playerSp: PLAYER_MAX_SP,
    enemyHp: level.enemy.maxHp,
    round: 1,
    outcome: 'active',
    log: `${level.enemy.name} blocks the trail. Choose your action.`,
  };
}
function enemyResponse(
  next: BattleState,
  level: Level,
  message: string,
  guarding = false,
): BattleState {
  if (next.enemyHp === 0)
    return {
      ...next,
      outcome: 'victory',
      log: `${message} ${level.enemy.name} is defeated.`,
    };
  const damage = guarding
    ? Math.ceil(level.enemy.attack / 2)
    : level.enemy.attack;
  next.playerHp = Math.max(0, next.playerHp - damage);
  next.outcome = next.playerHp === 0 ? 'defeat' : 'active';
  next.round++;
  next.log = `${message} ${level.enemy.name} deals ${damage} damage.${next.outcome === 'defeat' ? ' Your HP reaches 0. You die.' : ''}`;
  return next;
}
/** Invalid, locked or unaffordable actions never spend SP or advance a turn. */
export function resolveTurn(
  state: BattleState,
  action: BattleAction,
  level: Level,
): BattleState {
  if (state.outcome !== 'active') return state;
  const next = { ...state };
  if (action === 'attack') {
    next.enemyHp = Math.max(0, next.enemyHp - heroLoadout.weapon.damage);
    return enemyResponse(
      next,
      level,
      `Your level-one iron blade deals ${heroLoadout.weapon.damage} damage.`,
    );
  }
  if (action === 'guard')
    return enemyResponse(
      next,
      level,
      'You brace with your blade. The next hit is halved.',
      true,
    );
  const spell = starterSpells.find((item) => `spell:${item.id}` === action);
  if (!spell || next.playerSp < spell.spCost) return state;
  next.playerSp -= spell.spCost;
  next.enemyHp = Math.max(0, next.enemyHp - spell.damage);
  return enemyResponse(
    next,
    level,
    `${spell.name} deals ${spell.damage} ${spell.element} damage and costs ${spell.spCost} SP.`,
  );
}
/** One trivia question is one turn; wrong, skipped and expired answers restore 0 SP. */
export function resolveTrivia(
  state: BattleState,
  correct: boolean,
  level: Level,
): BattleState {
  if (state.outcome !== 'active') return state;
  const restored = correct
    ? Math.min(triviaRules.spReward, PLAYER_MAX_SP - state.playerSp)
    : 0;
  return enemyResponse(
    { ...state, playerSp: state.playerSp + restored },
    level,
    `${correct ? 'Correct answer!' : 'No correct answer.'} You restore ${restored} SP.`,
  );
}
