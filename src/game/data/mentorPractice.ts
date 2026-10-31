import type { Level } from './levels';
import type { BattleAction } from '../systems/battle';

export const mentorPracticeLevel: Level = {
  id: 'mentor-practice',
  name: 'Practice with Arojinle',
  description: 'A guided sparring lesson.',
  enemy: { name: 'Arojinle', maxHp: 100, attack: 4 },
};
export const mentorPracticeSteps = [
  {
    id: 'melee',
    title: 'Try a melee attack',
    prompt:
      'Arojinle: Choose Fight to strike with your level-one iron blade. It costs no SP.',
  },
  {
    id: 'defend',
    title: 'Brace for a hit',
    prompt:
      'Arojinle: Choose Defend. You have no shield, but bracing with your blade halves my next hit from 4 to 2 damage.',
  },
  {
    id: 'spell',
    title: 'Cast an elemental spell',
    prompt:
      'Arojinle: Open Spells, check the affinity and SP cost, then cast any one of your four starter spells.',
  },
  {
    id: 'trivia',
    title: 'Restore your SP',
    prompt:
      'Arojinle: Choose Trivia and answer correctly to finish. I will wait while you practise. Wrong, skipped or expired answers restore no SP; you can try again.',
  },
] as const;
export interface PracticeGuide {
  step: number;
  complete: boolean;
}
export function practiceAllowsAction(
  step: number,
  action: BattleAction,
): boolean {
  return step === 0
    ? action === 'attack'
    : step === 1
      ? action === 'guard'
      : step === 2
        ? action.startsWith('spell:')
        : false;
}
