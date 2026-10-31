/** One non-blocking visual coach, shared by practice commands, spells and trivia. */
let dispose: (() => void) | undefined;

export function clearPracticeSpotlight(): void {
  dispose?.();
  dispose = undefined;
}

export function mountPracticeSpotlight(panel: HTMLElement): void {
  clearPracticeSpotlight();
  const events = new AbortController();
  const layer = document.createElement('div');
  layer.className = 'practice-spotlight';
  layer.setAttribute('aria-hidden', 'true');
  layer.hidden = true;
  const hole = document.createElement('div');
  hole.className = 'practice-spotlight-hole';
  const finger = document.createElement('div');
  finger.className = 'practice-finger';
  const image = document.createElement('img');
  image.src = `${import.meta.env.BASE_URL}assets/ui/tutorial-finger.png`;
  image.alt = '';
  image.draggable = false;
  image.width = 80;
  image.height = 80;
  finger.append(image);
  layer.append(hole, finger);
  document.body.append(layer);
  let preferred: HTMLButtonElement | undefined;
  let previous: HTMLElement | undefined;
  let frame = 0;
  let destroyed = false;

  const eligible = (button: HTMLButtonElement): boolean =>
    !button.disabled &&
    !button.classList.contains('battle-back') &&
    !!button.closest('.battle-actions');
  const position = (): void => {
    frame = 0;
    if (destroyed) return;
    const actions = panel.querySelector<HTMLElement>('.battle-actions');
    const busy =
      panel.querySelector('.battle-console')?.getAttribute('aria-busy') ===
      'true';
    if (!panel.isConnected || busy || !actions) {
      layer.hidden = true;
      return;
    }
    const buttons = [
      ...actions.querySelectorAll<HTMLButtonElement>('button'),
    ].filter(eligible);
    if (!buttons.length) {
      layer.hidden = true;
      return;
    }
    const active = document.activeElement;
    const leaving =
      active instanceof HTMLButtonElement &&
      active.id === 'return-map' &&
      panel.contains(active);
    const backing =
      active instanceof HTMLButtonElement &&
      active.classList.contains('battle-back') &&
      panel.contains(active);
    const trivia = actions.dataset.menu === 'trivia';
    const target =
      leaving || backing
        ? active
        : trivia
          ? actions
          : preferred?.isConnected && eligible(preferred)
            ? preferred
            : active instanceof HTMLButtonElement && eligible(active)
              ? active
              : buttons[0]!;
    if (target !== previous) {
      previous = target;
      const rect = target.getBoundingClientRect();
      if (rect.top < 80 || rect.bottom > innerHeight - 20)
        target.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: 'auto',
        });
    }
    const rect = target.getBoundingClientRect();
    if (
      rect.width === 0 ||
      rect.height === 0 ||
      rect.bottom < 8 ||
      rect.top > innerHeight - 8
    ) {
      layer.hidden = true;
      return;
    }
    layer.hidden = false;
    layer.dataset.guideTarget = leaving
      ? 'leave'
      : backing
        ? 'back'
        : trivia
          ? 'trivia'
          : ((target as HTMLButtonElement).dataset.action ??
            (target as HTMLButtonElement).dataset.menuOpen ??
            (target as HTMLButtonElement).dataset.guideAction ??
            'command');
    Object.assign(hole.style, {
      left: `${rect.left - 4}px`,
      top: `${rect.top - 4}px`,
      width: `${rect.width + 8}px`,
      height: `${rect.height + 8}px`,
    });
    // Point to the question block, never to a predetermined trivia answer.
    const anchor =
      trivia && !leaving && !backing
        ? actions.querySelector('h3')!.getBoundingClientRect()
        : rect;
    const below = anchor.top < 76;
    finger.dataset.side = below ? 'below' : 'above';
    finger.style.left = `${Math.max(42, Math.min(innerWidth - 42, anchor.left + anchor.width / 2))}px`;
    finger.style.top = `${below ? anchor.bottom - 10 : anchor.top - 70}px`;
  };
  const schedule = (): void => {
    if (!destroyed && !frame) frame = requestAnimationFrame(position);
  };
  const choose = (event: Event): void => {
    const button =
      event.target instanceof Element ? event.target.closest('button') : null;
    if (button instanceof HTMLButtonElement && eligible(button))
      preferred = button;
    schedule();
  };
  const mutation = new MutationObserver(schedule);
  mutation.observe(panel, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-busy', 'data-menu'],
  });
  const resize = new ResizeObserver(schedule);
  resize.observe(panel);
  panel.addEventListener('focusin', choose, { signal: events.signal });
  panel.addEventListener('pointerover', choose, { signal: events.signal });
  window.addEventListener('resize', schedule, { signal: events.signal });
  window.addEventListener('scroll', schedule, {
    capture: true,
    passive: true,
    signal: events.signal,
  });
  window.visualViewport?.addEventListener('resize', schedule, {
    signal: events.signal,
  });
  window.visualViewport?.addEventListener('scroll', schedule, {
    signal: events.signal,
  });
  image.addEventListener('load', schedule, { signal: events.signal });
  image.addEventListener(
    'error',
    () => {
      finger.hidden = true;
    },
    { signal: events.signal },
  );
  schedule();
  dispose = () => {
    destroyed = true;
    events.abort();
    mutation.disconnect();
    resize.disconnect();
    cancelAnimationFrame(frame);
    layer.remove();
  };
}
