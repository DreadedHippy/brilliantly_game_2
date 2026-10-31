import type { Point } from './trail';

export interface WorldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface WorldObstacle extends Point {
  radius: number;
}

export function clampToWorld(point: Point, bounds: WorldBounds): Point {
  return {
    x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, point.x)),
    y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, point.y)),
  };
}

export function resolveWorldPoint(
  point: Point,
  bounds: WorldBounds,
  obstacles: readonly WorldObstacle[],
  radius: number,
): Point {
  let result = clampToWorld(point, bounds);
  for (let pass = 0; pass < 6; pass++) {
    for (const obstacle of obstacles) {
      const dx = result.x - obstacle.x,
        dy = result.y - obstacle.y;
      const distance = Math.hypot(dx, dy),
        minimum = obstacle.radius + radius;
      if (distance < minimum)
        result = clampToWorld(
          {
            x: obstacle.x + (distance ? dx / distance : 0) * minimum,
            y: obstacle.y + (distance ? dy / distance : 1) * minimum,
          },
          bounds,
        );
    }
  }
  return result;
}

export function stepInWorld(
  position: Point,
  direction: Point,
  speed: number,
  seconds: number,
  bounds: WorldBounds,
  obstacles: readonly WorldObstacle[],
  radius: number,
): Point {
  let current = { ...position };
  const steps = Math.max(1, Math.ceil(seconds * 120));
  for (let step = 0; step < steps; step++)
    current = resolveWorldPoint(
      {
        x: current.x + (direction.x * speed * seconds) / steps,
        y: current.y + (direction.y * speed * seconds) / steps,
      },
      bounds,
      obstacles,
      radius,
    );
  return current;
}

/** Cached navigation grid; most taps use the unobstructed straight-line fast path. */
export class WorldNavigator {
  private readonly columns: number;
  private readonly rows: number;
  private readonly valid: Uint8Array;

  constructor(
    private readonly bounds: WorldBounds,
    private readonly obstacles: readonly WorldObstacle[],
    private readonly radius: number,
    private readonly cell = 24,
  ) {
    this.columns = Math.ceil(bounds.width / cell);
    this.rows = Math.ceil(bounds.height / cell);
    this.valid = new Uint8Array(this.columns * this.rows);
    for (let i = 0; i < this.valid.length; i++) {
      const point = this.point(i);
      const inside =
        point.x <= bounds.x + bounds.width &&
        point.y <= bounds.y + bounds.height;
      this.valid[i] = Number(
        inside &&
          obstacles.every(
            (obstacle) =>
              Math.hypot(point.x - obstacle.x, point.y - obstacle.y) >
              obstacle.radius + radius + 2,
          ),
      );
    }
  }

  private point(index: number): Point {
    return {
      x: this.bounds.x + ((index % this.columns) + 0.5) * this.cell,
      y: this.bounds.y + (Math.floor(index / this.columns) + 0.5) * this.cell,
    };
  }

  private clear(a: Point, b: Point): boolean {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      lengthSq = dx * dx + dy * dy;
    return this.obstacles.every((obstacle) => {
      const t = lengthSq
        ? Math.max(
            0,
            Math.min(
              1,
              ((obstacle.x - a.x) * dx + (obstacle.y - a.y) * dy) / lengthSq,
            ),
          )
        : 0;
      return (
        Math.hypot(a.x + dx * t - obstacle.x, a.y + dy * t - obstacle.y) >=
        obstacle.radius + this.radius - 0.001
      );
    });
  }

  private nearest(point: Point): number {
    const column = Math.floor((point.x - this.bounds.x) / this.cell),
      row = Math.floor((point.y - this.bounds.y) / this.cell);
    let best = -1,
      distance = Infinity;
    for (let ring = 0; ring <= 5; ring++) {
      for (
        let y = Math.max(0, row - ring);
        y <= Math.min(this.rows - 1, row + ring);
        y++
      ) {
        for (
          let x = Math.max(0, column - ring);
          x <= Math.min(this.columns - 1, column + ring);
          x++
        ) {
          const i = y * this.columns + x;
          if (!this.valid[i]) continue;
          const candidate = this.point(i),
            separation = Math.hypot(
              candidate.x - point.x,
              candidate.y - point.y,
            );
          if (separation < distance && this.clear(point, candidate)) {
            best = i;
            distance = separation;
          }
        }
      }
      if (best !== -1) return best;
    }
    return best;
  }

  route(start: Point, requested: Point): Point[] {
    const target = resolveWorldPoint(
      requested,
      this.bounds,
      this.obstacles,
      this.radius + 3,
    );
    if (this.clear(start, target)) return [target];
    const source = this.nearest(start),
      end = this.nearest(target);
    if (source < 0 || end < 0) return [];
    const scores = new Float64Array(this.valid.length).fill(Infinity);
    const previous = new Int32Array(this.valid.length).fill(-1);
    const closed = new Uint8Array(this.valid.length);
    const open = new Set<number>([source]);
    scores[source] = 0;
    const heuristic = (index: number): number => {
      const p = this.point(index);
      return Math.hypot(p.x - target.x, p.y - target.y);
    };
    while (open.size) {
      let current = -1,
        lowest = Infinity;
      for (const index of open) {
        const score = scores[index]! + heuristic(index);
        if (score < lowest) {
          lowest = score;
          current = index;
        }
      }
      if (current === end) {
        const reversed: Point[] = [target];
        for (let index = end; index !== -1; index = previous[index]!)
          reversed.push(this.point(index));
        const raw = reversed.reverse(),
          result: Point[] = [];
        let anchor = start,
          index = 0;
        while (index < raw.length) {
          let last = index;
          for (let next = index + 1; next < raw.length; next++) {
            if (this.clear(anchor, raw[next]!)) last = next;
          }
          anchor = raw[last]!;
          result.push(anchor);
          index = last + 1;
        }
        return result;
      }
      open.delete(current);
      closed[current] = 1;
      const x = current % this.columns,
        y = Math.floor(current / this.columns);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (
            (!dx && !dy) ||
            x + dx < 0 ||
            x + dx >= this.columns ||
            y + dy < 0 ||
            y + dy >= this.rows
          )
            continue;
          const next = (y + dy) * this.columns + x + dx;
          if (
            !this.valid[next] ||
            closed[next] ||
            !this.clear(this.point(current), this.point(next))
          )
            continue;
          const score = scores[current]! + Math.hypot(dx, dy) * this.cell;
          if (score < scores[next]!) {
            scores[next] = score;
            previous[next] = current;
            open.add(next);
          }
        }
    }
    return [];
  }
}
