import {
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  panMapView,
  zoomMapView,
  type MapPoint,
  type MapSize,
  type MapView,
} from '../game/systems/mapView';

interface TrackedPointer extends MapPoint {
  startClientX: number;
  startClientY: number;
}

/** Own map gestures and send the same logical transform to HTML and Phaser. */
export function mountMapNavigation(
  host: HTMLElement,
  overlay: HTMLElement,
  world: HTMLElement,
  size: MapSize,
  onView: (view: MapView) => void,
): () => void {
  let view: MapView = { zoom: 1, x: 0, y: 0 };
  let moved = false;
  const pointers = new Map<number, TrackedPointer>();
  const previousLabel = host.getAttribute('aria-label');
  const controls = document.createElement('div');
  controls.className = 'map-navigation';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Map view controls');
  const zoomIn = document.createElement('button');
  const zoomOut = document.createElement('button');
  const resetButton = document.createElement('button');
  const output = document.createElement('output');
  output.setAttribute('aria-label', 'Map zoom');
  output.setAttribute('aria-live', 'off');
  controls.append(zoomOut, output, zoomIn, resetButton);
  overlay.append(controls);

  const render = (): void => {
    world.style.transform = `translate(${(view.x / size.width) * 100}%, ${(view.y / size.height) * 100}%) scale(${view.zoom})`;
    overlay.classList.toggle('can-pan', view.zoom > 1);
    output.value = `${Math.round(view.zoom * 100)}%`;
    zoomIn.disabled = view.zoom >= MAX_MAP_ZOOM;
    zoomOut.disabled = view.zoom <= MIN_MAP_ZOOM;
    onView(view);
  };
  const localPoint = (clientX: number, clientY: number): MapPoint => {
    const bounds = host.getBoundingClientRect();
    return {
      x: ((clientX - bounds.left) / bounds.width) * size.width,
      y: ((clientY - bounds.top) / bounds.height) * size.height,
    };
  };
  const center = { x: size.width / 2, y: size.height / 2 };
  const zoom = (factor: number, anchor = center): void => {
    view = zoomMapView(view, size, view.zoom * factor, anchor);
    render();
  };
  const reset = (): void => {
    view = { zoom: 1, x: 0, y: 0 };
    render();
  };
  const controlActions = [
    {
      button: zoomOut,
      label: 'Zoom out',
      text: '−',
      action: 'out',
      run: () => zoom(1 / 1.25),
    },
    {
      button: zoomIn,
      label: 'Zoom in',
      text: '+',
      action: 'in',
      run: () => zoom(1.25),
    },
    {
      button: resetButton,
      label: 'Reset map view',
      text: 'Reset',
      action: 'reset',
      run: reset,
    },
  ];
  for (const { button, label, text, action, run } of controlActions) {
    button.type = 'button';
    button.textContent = text;
    button.setAttribute('aria-label', label);
    button.dataset.mapAction = action;
    button.addEventListener('click', run);
  }

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const unit =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? host.clientHeight
          : 1;
    const delta = Math.max(-1000, Math.min(1000, event.deltaY * unit));
    zoom(Math.exp(-delta * 0.0015), localPoint(event.clientX, event.clientY));
  };
  const onDown = (event: PointerEvent): void => {
    if (pointers.size === 0) moved = false;
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest('.map-navigation')
    )
      return;
    const point = localPoint(event.clientX, event.clientY);
    pointers.set(event.pointerId, {
      ...point,
      startClientX: event.clientX,
      startClientY: event.clientY,
    });
    if (pointers.size > 1) {
      moved = true;
      overlay.classList.add('is-dragging');
      for (const id of pointers.keys()) host.setPointerCapture(id);
    } else if (!(event.target as HTMLElement).closest('.map-node')) {
      host.focus({ preventScroll: true });
    }
  };
  const onMove = (event: PointerEvent): void => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const before = [...pointers.values()];
    const point = localPoint(event.clientX, event.clientY);
    const wasMoved = moved;
    if (
      Math.hypot(
        event.clientX - previous.startClientX,
        event.clientY - previous.startClientY,
      ) >= 6
    )
      moved = true;
    pointers.set(event.pointerId, { ...previous, ...point });
    if (!moved) return;
    host.setPointerCapture(event.pointerId);
    overlay.classList.add('is-dragging');
    if (pointers.size === 2) {
      const [a, b] = before as [TrackedPointer, TrackedPointer];
      const [nextA, nextB] = [...pointers.values()] as [
        TrackedPointer,
        TrackedPointer,
      ];
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const nextDistance = Math.hypot(nextB.x - nextA.x, nextB.y - nextA.y);
      if (distance > 0) {
        view = zoomMapView(
          view,
          size,
          (view.zoom * nextDistance) / distance,
          { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          { x: (nextA.x + nextB.x) / 2, y: (nextA.y + nextB.y) / 2 },
        );
      }
    } else if (pointers.size === 1) {
      const start = wasMoved
        ? previous
        : localPoint(previous.startClientX, previous.startClientY);
      view = panMapView(view, size, {
        x: point.x - start.x,
        y: point.y - start.y,
      });
    }
    render();
  };
  const onUp = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (host.hasPointerCapture(event.pointerId))
      host.releasePointerCapture(event.pointerId);
    if (pointers.size === 0) overlay.classList.remove('is-dragging');
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.map-navigation button, .map-node',
    );
    // Browsers can suppress compatibility clicks after a multitouch gesture.
    // Activate a clean touch tap once, then suppress any duplicate native click.
    if (event.pointerType === 'touch' && !moved && button && !button.disabled) {
      event.preventDefault();
      moved = true;
      button.click();
    }
  };
  const cancel = (): void => {
    moved = true;
    for (const id of pointers.keys())
      if (host.hasPointerCapture(id)) host.releasePointerCapture(id);
    pointers.clear();
    overlay.classList.remove('is-dragging');
  };
  const onClick = (event: MouseEvent): void => {
    if (moved && event.detail !== 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  const onKey = (event: KeyboardEvent): void => {
    if (
      (event.target as HTMLElement).closest('.map-navigation') ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const pan: Record<string, MapPoint> = {
      ArrowLeft: { x: 70, y: 0 },
      ArrowRight: { x: -70, y: 0 },
      ArrowUp: { x: 0, y: 70 },
      ArrowDown: { x: 0, y: -70 },
    };
    const panDelta = pan[event.key];
    if (panDelta) {
      event.preventDefault();
      view = panMapView(view, size, panDelta);
      render();
    } else if (['+', '='].includes(event.key)) {
      event.preventDefault();
      zoom(1.25);
    } else if (['-', '_'].includes(event.key)) {
      event.preventDefault();
      zoom(1 / 1.25);
    } else if (['Home', '0'].includes(event.key)) {
      event.preventDefault();
      reset();
    }
  };
  // Reveal a marker reached by keyboard without moving the surrounding document.
  const onFocus = (event: FocusEvent): void => {
    const node = (event.target as HTMLElement).closest<HTMLElement>(
      '.map-node',
    );
    if (!node?.matches(':focus-visible')) return;
    const bounds = host.getBoundingClientRect();
    const target = node.getBoundingClientRect();
    if (
      target.left >= bounds.left &&
      target.right <= bounds.right &&
      target.top >= bounds.top &&
      target.bottom <= bounds.bottom
    )
      return;
    const x = (Number.parseFloat(node.style.left) / 100) * size.width;
    const y = (Number.parseFloat(node.style.top) / 100) * size.height;
    view = panMapView(view, size, {
      x: size.width / 2 - x * view.zoom - view.x,
      y: size.height / 2 - y * view.zoom - view.y,
    });
    render();
  };

  host.classList.add('map-viewport');
  host.setAttribute(
    'aria-label',
    'World map. Drag to pan, scroll or pinch to zoom. Use arrow keys to pan, plus or minus to zoom, and Home to reset.',
  );
  host.addEventListener('wheel', onWheel, { passive: false });
  host.addEventListener('pointerdown', onDown, true);
  host.addEventListener('pointermove', onMove, true);
  host.addEventListener('pointerup', onUp, true);
  host.addEventListener('pointercancel', cancel, true);
  host.addEventListener('click', onClick, true);
  host.addEventListener('keydown', onKey);
  world.addEventListener('focusin', onFocus);
  window.addEventListener('blur', cancel);
  render();
  return () => {
    cancel();
    host.classList.remove('map-viewport');
    if (previousLabel === null) host.removeAttribute('aria-label');
    else host.setAttribute('aria-label', previousLabel);
    host.removeEventListener('wheel', onWheel);
    host.removeEventListener('pointerdown', onDown, true);
    host.removeEventListener('pointermove', onMove, true);
    host.removeEventListener('pointerup', onUp, true);
    host.removeEventListener('pointercancel', cancel, true);
    host.removeEventListener('click', onClick, true);
    host.removeEventListener('keydown', onKey);
    world.removeEventListener('focusin', onFocus);
    window.removeEventListener('blur', cancel);
    for (const { button, run } of controlActions)
      button.removeEventListener('click', run);
  };
}
