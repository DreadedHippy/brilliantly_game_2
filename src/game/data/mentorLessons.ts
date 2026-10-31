/** Stable line IDs keep the lesson copy separate from its presentation. */
export const mentorLessons = [
  {
    id: 'mentor.vitals',
    title: 'Look after your life',
    line: 'You and your companions each have HP and SP. HP keeps you alive. When your HP reaches zero, you die. Keep an eye on your companions’ HP, too.',
    reminder: 'HP reaches 0 → death',
  },
  {
    id: 'mentor.turns',
    title: 'Take your turn',
    line: 'You and the enemy take turns. On your turn, choose a melee attack, defend in a guarded stance, or cast a skill. Think about your next move before the enemy acts.',
    reminder: 'Your turn → enemy turn → your turn',
  },
  {
    id: 'mentor.weapon-shield',
    title: 'Strike or defend?',
    line: 'Choose a melee attack to strike the enemy with your weapon. You carry a level-one iron blade and no shield. Choose Defend to brace with your blade and halve the next enemy hit.',
    reminder: 'Melee: 12 damage. Defend: halve the next hit.',
  },
  {
    id: 'mentor.skills',
    title: 'Skills spend SP',
    line: 'Casting a skill costs SP. You and your companions each have your own SP, so check who has enough before choosing a skill.',
    reminder: 'Cast a skill → spend SP',
  },
  {
    id: 'mentor.affinities',
    title: 'Know your spell affinities',
    line: 'Every spell has one elemental affinity: Fire, Storm, Wind or Earth. Ember shot is Fire, Storm spark is Storm, Cutting gust is Wind, and Stone shard is Earth. In the Spells menu, check the affinity alongside damage and SP cost. These first battles use base damage, without elemental bonuses or resistances.',
    reminder:
      'Fire · Storm · Wind · Earth. Affinity identifies a spell’s element.',
  },
  {
    id: 'mentor.trivia',
    title: 'Let knowledge restore you',
    line: 'On any of your turns, you can choose to replenish SP by answering timed trivia questions. You have 12 seconds for one question. Answering, skipping or running out of time uses your turn, then the enemy responds.',
    reminder: 'Your turn → timed trivia → a chance to restore SP',
  },
  {
    id: 'mentor.answers',
    title: 'Every correct answer counts',
    line: 'Each correct answer restores some SP: up to 10, capped at your maximum. A wrong answer restores no SP. Protect your HP, spend your SP wisely, and use your knowledge to recover it.',
    reminder: 'Correct answer: gain SP. Wrong answer: gain 0 SP.',
  },
] as const;
