// Shared by Phaser and the CSS adapter in main.ts; do not duplicate palette values.
export const palette = {
  ink: '#202b47',
  surface: '#2b3855',
  text: '#f5edda',
  muted: '#bac6cf',
  gold: '#edc779',
  river: '#74b7b5',
  border: '#526078',
  land: '#3b5362',
} as const;

export const color = (key: keyof typeof palette): number =>
  Number.parseInt(palette[key].slice(1), 16);
