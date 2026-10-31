// Session-only progress; persistence can be added without coupling it to scenes.
export const progress = {
  completed: new Set<string>(),
  encounters: new Set<string>(),
};
