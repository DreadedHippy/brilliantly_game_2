import { isLevelUnlocked, levels } from '../game/data/levels';
import type { MapRegion, WorldMapIndex } from '../game/data/worldMap';
import type { MapView } from '../game/systems/mapView';
import { mountMapNavigation } from './mapNavigation';

const compass = `<svg class="map-compass" viewBox="0 0 100 110" role="img" aria-label="Compass, north points up">
  <circle cx="50" cy="58" r="30"/><circle class="compass-inner" cx="50" cy="58" r="24"/>
  <path class="compass-light" d="M50 23 56 52 85 58 56 64 50 93 44 64 15 58 44 52Z"/>
  <path class="compass-dark" d="M50 23 50 58 56 52ZM85 58 50 58 56 64ZM50 93 50 58 44 64ZM15 58 50 58 44 52Z"/>
  <circle class="compass-center" cx="50" cy="58" r="3"/>
  <text x="50" y="15">N</text><text x="94" y="62">E</text><text x="50" y="107">S</text><text x="6" y="62">W</text>
</svg>`;

export function mountMapOverlay(
  map: WorldMapIndex,
  regions: MapRegion[],
  completed: ReadonlySet<string>,
  enter: (id: string) => void,
  artworkLoaded: boolean,
  onView: (view: MapView) => void,
): () => void {
  const host = document.querySelector<HTMLElement>('#game');
  if (!host) throw new Error('The map host is missing.');
  const overlay = document.createElement('div');
  overlay.className = 'map-overlay';
  overlay.dataset.artwork = artworkLoaded ? 'ready' : 'unavailable';
  overlay.setAttribute('role', 'group');
  overlay.setAttribute('aria-label', 'World map destinations');
  const { width, height } = map.coordinate_system;
  const route = regions
    .map(({ map_position: p }, index) => {
      if (index === 0) return `M ${p.x} ${p.y}`;
      const previous = regions[index - 1]!.map_position;
      const middle = (p.x + previous.x) / 2;
      return `C ${middle} ${previous.y}, ${middle} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');
  overlay.innerHTML = `<div class="map-title" aria-hidden="true"><span>The first route</span><p>Across river & highland</p></div>
    ${compass}`;
  const world = document.createElement('div');
  world.className = 'map-world';
  world.innerHTML = `<svg class="map-route" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path class="route-shadow" d="${route}"/><path class="route-trail" d="${route}"/></svg>`;
  overlay.prepend(world);
  const markersById = new Map<string, HTMLButtonElement>();
  for (const [index, region] of regions.entries()) {
    const levelIndex = levels.findIndex((level) => level.id === region.id);
    const unlocked = levelIndex >= 0 && isLevelUnlocked(levelIndex, completed);
    const complete = completed.has(region.id);
    const button = document.createElement('button');
    button.className = `map-node${complete ? ' is-complete' : ''}`;
    button.dataset.regionId = region.id;
    button.disabled = !unlocked;
    button.style.left = `${(region.map_position.x / width) * 100}%`;
    button.style.top = `${(region.map_position.y / height) * 100}%`;
    button.setAttribute(
      'aria-label',
      `${region.name}, ${complete ? 'completed, revisit' : unlocked ? 'explore level' : 'locked'}`,
    );
    button.title = unlocked
      ? `Explore ${region.name}`
      : 'Complete the previous encounter to unlock';
    button.innerHTML = `<span class="map-node-lift"><span class="map-node-disc"><span class="map-node-symbol" aria-hidden="true">${complete ? '✓' : unlocked ? String(index + 1).padStart(2, '0') : '<svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Z"/><circle cx="12" cy="15" r="1"/></svg>'}</span></span><span class="map-node-name">${region.name}</span><span class="map-node-state">${complete ? 'Complete' : unlocked ? 'Explore' : 'Locked'}</span></span>`;
    button.addEventListener('click', () => enter(region.id));
    world.append(button);
    markersById.set(region.id, button);
  }
  if (!artworkLoaded) {
    const message = document.createElement('p');
    message.className = 'map-art-message';
    message.setAttribute('role', 'status');
    message.textContent = 'Map artwork is unavailable. Reload to try again.';
    overlay.append(message);
  }
  host.append(overlay);
  const cleanupNavigation = mountMapNavigation(
    host,
    overlay,
    world,
    { width, height },
    onView,
  );
  // Sidebar focus and pointer hover emphasize the matching map marker too.
  const sidebar = document.querySelector<HTMLElement>('.destinations');
  let hoveredId: string | undefined;
  let focusedId: string | undefined;
  const emphasize = (event: Event): void => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-region-id]',
    );
    const id = target?.dataset.regionId;
    if (event.type === 'pointerover') hoveredId = id;
    if (event.type === 'pointerout') hoveredId = undefined;
    if (event.type === 'focusin') focusedId = id;
    if (event.type === 'focusout') focusedId = undefined;
    for (const [regionId, node] of markersById) {
      node.classList.toggle(
        'is-highlighted',
        regionId === hoveredId || regionId === focusedId,
      );
    }
  };
  const events = ['pointerover', 'pointerout', 'focusin', 'focusout'];
  for (const event of events) sidebar?.addEventListener(event, emphasize);
  return () => {
    cleanupNavigation();
    for (const event of events) sidebar?.removeEventListener(event, emphasize);
    overlay.remove();
  };
}
