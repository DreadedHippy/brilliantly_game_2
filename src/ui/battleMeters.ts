/** Presentation-only values; combat resolution never reads these interpolated meters. */
const meterIds = ['player-health', 'player-sp', 'enemy-health'] as const;
export type BattleMeterSnapshot = Partial<
  Record<(typeof meterIds)[number], number>
>;

export function captureBattleMeters(): BattleMeterSnapshot {
  const snapshot: BattleMeterSnapshot = {};
  for (const id of meterIds) {
    const meter = document.querySelector<HTMLMeterElement>(`#${id}`);
    if (meter) snapshot[id] = meter.value;
  }
  return snapshot;
}

export function animateBattleMeters(
  host: HTMLElement,
  previous: BattleMeterSnapshot,
): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  for (const id of meterIds) {
    const meter = host.querySelector<HTMLMeterElement>(`#${id}`);
    if (!meter) continue;
    const target = meter.value;
    const start = Math.max(
      meter.min,
      Math.min(meter.max, previous[id] ?? target),
    );
    meter.dataset.animating = 'false';
    if (reduced.matches || start === target) continue;
    const began = performance.now();
    meter.value = start;
    meter.dataset.animating = 'true';
    const step = (now: number): void => {
      if (!meter.isConnected) return;
      const progress = reduced.matches ? 1 : Math.min(1, (now - began) / 420);
      meter.value = start + (target - start) * (1 - (1 - progress) ** 3);
      if (progress < 1) requestAnimationFrame(step);
      else {
        meter.value = target;
        meter.dataset.animating = 'false';
      }
    };
    requestAnimationFrame(step);
  }
}
