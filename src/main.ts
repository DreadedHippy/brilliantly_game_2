import './style.css';
import { createGame } from './game/createGame';
import { palette } from './game/theme';
import { mountShell } from './ui/shell';

for (const [name, value] of Object.entries(palette)) {
  document.documentElement.style.setProperty(`--color-${name}`, value);
}
mountShell();
const game = createGame();
if (import.meta.env.DEV) {
  // Read-only development access avoids importing and mounting the entry twice in browser checks.
  Object.defineProperty(window, '__brilliantlyGame', {
    configurable: true,
    get: () => game,
  });
}

// Vite can replace modules without leaving extra canvases or game loops behind.
if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true));
