import { describe, expect, it } from 'vitest';
import { stageOne } from '../../src/game/data/stageOne';
import environment from '../../public/assets/maps/stage-1-1/environment.json';
import {
  WorldNavigator,
  stepInWorld,
} from '../../src/game/systems/worldMovement';
import { projectToTrail } from '../../src/game/systems/trail';
import { stageOneTrail } from '../../src/game/data/stageOne';

const bounds = stageOne.navigation.bounds;
const obstacles = [
  ...environment.props.filter((prop) => prop.radius > 0),
  stageOne.npc,
];
const radius = stageOne.player.radius;

describe('free exploration', () => {
  it('crosses grass beyond the road with both keyboard-style movement and direct tap routing', () => {
    const start = { x: 1500, y: 600 };
    const point = stepInWorld(
      start,
      { x: 0, y: -1 },
      220,
      1,
      bounds,
      obstacles,
      radius,
    );
    expect(point.y).toBeCloseTo(380);
    expect(projectToTrail(point, stageOneTrail).separation).toBeGreaterThan(
      stageOne.road.width,
    );
    expect(
      new WorldNavigator(bounds, obstacles, radius).route(start, point),
    ).toEqual([point]);
  });

  it('routes around the mentor and reaches an off-road target without crossing any footprint', () => {
    const navigator = new WorldNavigator(bounds, obstacles, radius);
    const start = { x: 510, y: 600 },
      target = { x: 510, y: 400 };
    const route = navigator.route(start, target);
    expect(route.length).toBeGreaterThan(1);
    let position = start;
    for (const waypoint of route) {
      let steps = 0;
      while (
        Math.hypot(waypoint.x - position.x, waypoint.y - position.y) > 6 &&
        steps++ < 1200
      ) {
        const dx = waypoint.x - position.x,
          dy = waypoint.y - position.y,
          distance = Math.hypot(dx, dy);
        position = stepInWorld(
          position,
          { x: dx / distance, y: dy / distance },
          Math.min(350, distance * 60),
          1 / 60,
          bounds,
          obstacles,
          radius,
        );
        for (const obstacle of obstacles)
          expect(
            Math.hypot(position.x - obstacle.x, position.y - obstacle.y),
          ).toBeGreaterThanOrEqual(obstacle.radius + radius - 0.01);
      }
      expect(steps).toBeLessThan(1200);
    }
    expect(
      Math.hypot(position.x - target.x, position.y - target.y),
    ).toBeLessThan(7);
  });

  it('keeps the entire character safely inside level edges and cannot tunnel through the mentor', () => {
    const edge = stepInWorld(
      { x: 100, y: 200 },
      { x: -1, y: -1 },
      5000,
      1,
      bounds,
      obstacles,
      radius,
    );
    expect(edge.x).toBe(bounds.x);
    expect(edge.y).toBe(bounds.y);
    const blocked = stepInWorld(
      { x: 510, y: 600 },
      { x: 0, y: -1 },
      2000,
      1,
      bounds,
      [stageOne.npc],
      radius,
    );
    expect(blocked.y).toBeCloseTo(
      stageOne.npc.y + stageOne.npc.radius + radius,
    );
  });

  it('has the same movement speed at 30 and 120 updates per second', () => {
    const run = (fps: number) => {
      let position = { x: 1500, y: 400 };
      for (let i = 0; i < fps; i++)
        position = stepInWorld(
          position,
          { x: 1, y: 0 },
          220,
          1 / fps,
          bounds,
          obstacles,
          radius,
        );
      return position;
    };
    expect(run(30).x).toBeCloseTo(run(120).x, 5);
    expect(run(30).y).toBeCloseTo(run(120).y, 5);
  });

  it('replaces a tap inside a solid footprint with a reachable nearby position', () => {
    const route = new WorldNavigator(bounds, obstacles, radius).route(
      stageOne.player,
      stageOne.npc,
    );
    expect(route.length).toBeGreaterThan(0);
    const last = route.at(-1)!;
    expect(
      Math.hypot(last.x - stageOne.npc.x, last.y - stageOne.npc.y),
    ).toBeGreaterThan(stageOne.npc.radius + radius);
  });
});
