import { masquerade } from './combat';
export interface Level {
  id: string;
  name: string;
  description: string;
  enemy: { name: string; maxHp: number; attack: number };
}

// Fictional working locations. Replace alongside the approved setting bible.
export const levels: readonly Level[] = [
  {
    id: 'river-crossing',
    name: 'River crossing',
    description:
      'Stage 1-1. Meet Arojinle and explore the winding savanna trail.',
    enemy: masquerade,
  },
  {
    id: 'highland-path',
    name: 'Highland path',
    description: 'Travel inland to the next practice encounter.',
    enemy: { name: 'Highland sentinel', maxHp: 38, attack: 8 },
  },
  {
    id: 'copper-gate',
    name: 'Copper gate',
    description: 'Complete the final encounter on this prototype route.',
    enemy: { name: 'Gate sentinel', maxHp: 46, attack: 9 },
  },
];

export function isLevelUnlocked(
  index: number,
  completed: ReadonlySet<string>,
): boolean {
  const previous = levels[index - 1];
  return index === 0 || (previous !== undefined && completed.has(previous.id));
}
