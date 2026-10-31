export interface Point {
  x: number;
  y: number;
}
export interface TrailPoint extends Point {
  distance: number;
}
export interface Projection extends Point {
  distance: number;
  separation: number;
  index: number;
}

export function sampleTrail(
  controls: readonly (readonly number[])[],
  samples: number,
): TrailPoint[] {
  const result: TrailPoint[] = [];
  for (let index = 0; index < controls.length - 1; index++) {
    const a = controls[Math.max(0, index - 1)]!;
    const b = controls[index]!;
    const c = controls[index + 1]!;
    const d = controls[Math.min(controls.length - 1, index + 2)]!;
    for (let step = 0; step < samples; step++) {
      const t = step / samples;
      const coordinate = (axis: number): number =>
        0.5 *
        (2 * b[axis]! +
          (-a[axis]! + c[axis]!) * t +
          (2 * a[axis]! - 5 * b[axis]! + 4 * c[axis]! - d[axis]!) * t * t +
          (-a[axis]! + 3 * b[axis]! - 3 * c[axis]! + d[axis]!) * t * t * t);
      const previous = result.at(-1);
      const point = { x: coordinate(0), y: coordinate(1) };
      result.push({
        ...point,
        distance: previous
          ? previous.distance +
            Math.hypot(point.x - previous.x, point.y - previous.y)
          : 0,
      });
    }
  }
  const last = controls.at(-1)!;
  const previous = result.at(-1)!;
  result.push({
    x: last[0]!,
    y: last[1]!,
    distance:
      previous.distance +
      Math.hypot(last[0]! - previous.x, last[1]! - previous.y),
  });
  return result;
}

export function projectToTrail(
  point: Point,
  trail: readonly TrailPoint[],
): Projection {
  let best: Projection = { ...trail[0]!, separation: Infinity, index: 0 };
  for (let index = 0; index < trail.length - 1; index++) {
    const a = trail[index]!;
    const b = trail[index + 1]!;
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t = Math.max(
      0,
      Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq),
    );
    const x = a.x + dx * t,
      y = a.y + dy * t;
    const separation = Math.hypot(point.x - x, point.y - y);
    if (separation < best.separation)
      best = {
        x,
        y,
        separation,
        index,
        distance: a.distance + (b.distance - a.distance) * t,
      };
  }
  return best;
}

export function followTrailCamera(
  current: Point,
  target: Point,
  seconds: number,
  world: { width: number; height: number },
  viewport: { width: number; height: number },
  deadzone: Point,
  rate: number,
): Point {
  const overflow = (value: number, half: number): number =>
    Math.sign(value) * Math.max(0, Math.abs(value) - half);
  const desired = {
    x: current.x + overflow(target.x - current.x, deadzone.x),
    y: current.y + overflow(target.y - current.y, deadzone.y),
  };
  const blend = 1 - Math.exp(-rate * seconds);
  return {
    x: Math.max(
      viewport.width / 2,
      Math.min(
        world.width - viewport.width / 2,
        current.x + (desired.x - current.x) * blend,
      ),
    ),
    y: Math.max(
      viewport.height / 2,
      Math.min(
        world.height - viewport.height / 2,
        current.y + (desired.y - current.y) * blend,
      ),
    ),
  };
}
