import type { Point } from '../game/systems/trail';

export function mountStageControls(
  host: HTMLElement,
  onDirection: (direction: Point) => void,
  onRun: (running: boolean) => void,
): () => void {
  const controls = document.createElement('div');
  controls.className = 'level-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Character movement');
  const active = new Map<string, Point>();
  const refresh = (): void => {
    const directions = [...active.values()];
    onDirection({
      x: directions.reduce((sum, point) => sum + point.x, 0),
      y: directions.reduce((sum, point) => sum + point.y, 0),
    });
  };
  const clear = (): void => {
    active.clear();
    refresh();
  };
  for (const [name, symbol, direction] of [
    ['left', '←', { x: -1, y: 0 }],
    ['up', '↑', { x: 0, y: -1 }],
    ['down', '↓', { x: 0, y: 1 }],
    ['right', '→', { x: 1, y: 0 }],
  ] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', `Move ${name}`);
    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      host.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
      active.set(String(event.pointerId), direction);
      refresh();
    });
    const release = (event: PointerEvent): void => {
      active.delete(String(event.pointerId));
      refresh();
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('keydown', (event) => {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      active.set(name, direction);
      refresh();
    });
    button.addEventListener('keyup', (event) => {
      if ([' ', 'Enter'].includes(event.key)) {
        active.delete(name);
        refresh();
      }
    });
    button.addEventListener('blur', () => {
      active.delete(name);
      refresh();
    });
    controls.append(button);
  }
  const run = document.createElement('button');
  run.type = 'button';
  run.textContent = 'Run';
  run.setAttribute('aria-pressed', 'false');
  run.addEventListener('click', () => {
    const running = run.getAttribute('aria-pressed') !== 'true';
    run.setAttribute('aria-pressed', String(running));
    onRun(running);
    host.focus({ preventScroll: true });
  });
  controls.append(run);
  host.append(controls);
  window.addEventListener('blur', clear);
  return () => {
    window.removeEventListener('blur', clear);
    clear();
    onRun(false);
    controls.remove();
  };
}
