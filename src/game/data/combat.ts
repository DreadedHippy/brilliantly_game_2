export type Element = 'Fire' | 'Storm' | 'Wind' | 'Earth';
export interface Spell {
  id: string;
  name: string;
  element: Element;
  damage: number;
  spCost: number;
  tier: number;
}
/** Later tiers are catalogue entries, not automatically granted by progression. */
export const spells: readonly Spell[] = [
  {
    id: 'ember',
    name: 'Ember shot',
    element: 'Fire',
    damage: 18,
    spCost: 6,
    tier: 1,
  },
  {
    id: 'spark',
    name: 'Storm spark',
    element: 'Storm',
    damage: 22,
    spCost: 8,
    tier: 1,
  },
  {
    id: 'gust',
    name: 'Cutting gust',
    element: 'Wind',
    damage: 14,
    spCost: 4,
    tier: 1,
  },
  {
    id: 'stone',
    name: 'Stone shard',
    element: 'Earth',
    damage: 20,
    spCost: 7,
    tier: 1,
  },
  {
    id: 'flame-lash',
    name: 'Flame lash',
    element: 'Fire',
    damage: 30,
    spCost: 11,
    tier: 2,
  },
  {
    id: 'thunderbolt',
    name: 'Thunderbolt',
    element: 'Storm',
    damage: 36,
    spCost: 14,
    tier: 2,
  },
  {
    id: 'wind-lance',
    name: 'Wind lance',
    element: 'Wind',
    damage: 26,
    spCost: 9,
    tier: 2,
  },
  {
    id: 'boulder',
    name: 'Boulder strike',
    element: 'Earth',
    damage: 33,
    spCost: 12,
    tier: 2,
  },
  {
    id: 'sunfire',
    name: 'Sunfire burst',
    element: 'Fire',
    damage: 46,
    spCost: 18,
    tier: 3,
  },
  {
    id: 'tempest',
    name: 'Tempest arc',
    element: 'Storm',
    damage: 54,
    spCost: 22,
    tier: 3,
  },
  {
    id: 'cyclone',
    name: 'Cyclone blade',
    element: 'Wind',
    damage: 40,
    spCost: 15,
    tier: 3,
  },
  {
    id: 'faultline',
    name: 'Faultline',
    element: 'Earth',
    damage: 50,
    spCost: 20,
    tier: 3,
  },
  {
    id: 'inferno',
    name: 'Inferno crown',
    element: 'Fire',
    damage: 68,
    spCost: 28,
    tier: 4,
  },
  {
    id: 'skybreak',
    name: 'Skybreak',
    element: 'Storm',
    damage: 80,
    spCost: 34,
    tier: 4,
  },
  {
    id: 'hurricane',
    name: 'Hurricane edge',
    element: 'Wind',
    damage: 60,
    spCost: 24,
    tier: 4,
  },
  {
    id: 'mountain',
    name: 'Mountain’s verdict',
    element: 'Earth',
    damage: 74,
    spCost: 31,
    tier: 4,
  },
];
export const heroLoadout = {
  maxHp: 120,
  maxSp: 40,
  weapon: {
    id: 'iron-blade-lv1',
    name: 'Iron blade',
    level: 1,
    damage: 12,
    description:
      'Broad leaf-shaped iron blade, wooden handle and cord bindings, based on the supplied level-one weapon reference.',
  },
  shield: null,
  starterSpellIds: ['ember', 'spark', 'gust', 'stone'] as readonly string[],
} as const;
export const starterSpells = spells.filter((spell) =>
  heroLoadout.starterSpellIds.includes(spell.id),
);
export const masquerade = {
  name: 'Masquerade',
  maxHp: 100,
  attack: 14,
} as const;
export const triviaRules = { durationMs: 12000, spReward: 10 } as const;
export const triviaQuestions = [
  {
    prompt: 'Which of these is a renewable energy source?',
    answers: ['Sunlight', 'Coal', 'Petrol', 'Natural gas'],
    correct: 0,
  },
  { prompt: 'What is 7 × 8?', answers: ['48', '54', '56', '64'], correct: 2 },
  {
    prompt: 'Which organ pumps blood around the body?',
    answers: ['Lungs', 'Heart', 'Liver', 'Stomach'],
    correct: 1,
  },
  {
    prompt: 'How many sides does a triangle have?',
    answers: ['Two', 'Four', 'Six', 'Three'],
    correct: 3,
  },
  {
    prompt: 'Which gas do plants absorb during photosynthesis?',
    answers: ['Oxygen', 'Helium', 'Carbon dioxide', 'Hydrogen'],
    correct: 2,
  },
  {
    prompt: 'Which ocean lies west of Africa?',
    answers: ['Atlantic', 'Pacific', 'Indian', 'Arctic'],
    correct: 0,
  },
] as const;
