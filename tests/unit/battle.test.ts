import { describe, expect, it } from 'vitest';
import { levels, isLevelUnlocked } from '../../src/game/data/levels';
import { heroLoadout, spells, starterSpells } from '../../src/game/data/combat';
import {
  createBattle,
  PLAYER_MAX_HP,
  resolveTurn,
  resolveTrivia,
} from '../../src/game/systems/battle';
const level = levels[0]!;
describe('encounter-one combat', () => {
  it('starts with the authored stats, exactly four starter affinities, and no shield', () => {
    expect(createBattle(level)).toMatchObject({
      playerHp: 120,
      playerSp: 40,
      enemyHp: 100,
    });
    expect(heroLoadout.shield).toBeNull();
    expect(new Set(starterSpells.map((s) => s.element))).toEqual(
      new Set(['Fire', 'Storm', 'Wind', 'Earth']),
    );
    expect(starterSpells).toHaveLength(4);
    expect(new Set(spells.map((s) => s.id)).size).toBe(16);
  });
  it('resolves melee and exactly one response without spending SP or mutating input', () => {
    const initial = createBattle(level);
    expect(resolveTurn(initial, 'attack', level)).toMatchObject({
      enemyHp: 88,
      playerHp: 106,
      playerSp: 40,
      round: 2,
    });
    expect(initial.playerHp).toBe(PLAYER_MAX_HP);
  });
  it('each starter deals its own damage and spends only its own SP cost', () => {
    for (const spell of starterSpells)
      expect(
        resolveTurn(createBattle(level), `spell:${spell.id}`, level),
      ).toMatchObject({
        enemyHp: 100 - spell.damage,
        playerSp: 40 - spell.spCost,
        playerHp: 106,
      });
  });
  it('rejects locked, unknown and unaffordable spells without advancing time', () => {
    const initial = { ...createBattle(level), playerSp: 3 };
    for (const id of ['ember', 'inferno', 'missing'])
      expect(resolveTurn(initial, `spell:${id}`, level)).toBe(initial);
  });
  it('defends without a shield, counterattack or SP cost, then clears defense', () => {
    const guarded = resolveTurn(createBattle(level), 'guard', level);
    expect(guarded).toMatchObject({
      playerHp: 113,
      enemyHp: 100,
      playerSp: 40,
    });
    expect(resolveTurn(guarded, 'attack', level).playerHp).toBe(99);
  });
  it('never retaliates after a killing hit and ignores actions after victory', () => {
    const result = resolveTurn(
      { ...createBattle(level), enemyHp: 3, playerHp: 1 },
      'spell:ember',
      level,
    );
    expect(result).toMatchObject({
      enemyHp: 0,
      playerHp: 1,
      playerSp: 34,
      outcome: 'victory',
    });
    expect(resolveTurn(result, 'attack', level)).toBe(result);
    expect(resolveTrivia(result, true, level)).toBe(result);
  });
  it('restores trivia SP only for correct answers, caps it, and responds once', () => {
    const state = { ...createBattle(level), playerSp: 37 };
    expect(resolveTrivia(state, true, level)).toMatchObject({
      playerSp: 40,
      playerHp: 106,
      round: 2,
    });
    expect(resolveTrivia(state, false, level)).toMatchObject({
      playerSp: 37,
      playerHp: 106,
      round: 2,
    });
    expect(resolveTrivia({ ...state, playerSp: 0 }, true, level).playerSp).toBe(
      10,
    );
  });
  it('clamps lethal damage to zero and prevents later actions or trivia', () => {
    const result = resolveTurn(
      { ...createBattle(level), playerHp: 1 },
      'guard',
      level,
    );
    expect(result).toMatchObject({ playerHp: 0, outcome: 'defeat' });
    expect(resolveTurn(result, 'attack', level)).toBe(result);
    expect(resolveTrivia(result, true, level)).toBe(result);
  });
});
describe('world progression', () => {
  it('does not open a later location without completing its preceding level', () => {
    const complete = new Set<string>();
    expect(isLevelUnlocked(0, complete)).toBe(true);
    expect(isLevelUnlocked(1, complete)).toBe(false);
    complete.add(level.id);
    expect(isLevelUnlocked(1, complete)).toBe(true);
    expect(isLevelUnlocked(2, complete)).toBe(false);
  });
});
