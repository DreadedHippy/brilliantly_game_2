import { describe, expect, it } from 'vitest';
import { stageOne, stageOneTrail } from '../../src/game/data/stageOne';
import { followTrailCamera } from '../../src/game/systems/trail';

describe('Stage 1-1 navigation', () => {
  it('keeps the sketch’s low middle and rising exit with a continuous trail', () => {
    expect(stageOneTrail[0]).toMatchObject({ x: 230, y: 565 });
    expect(stageOneTrail.at(-1)).toMatchObject({ x: 3320, y: 300 });
    expect(Math.max(...stageOneTrail.map((point) => point.y))).toBeGreaterThan(
      1010,
    );
    for (let i = 1; i < stageOneTrail.length; i++)
      expect(stageOneTrail[i]!.distance).toBeGreaterThan(
        stageOneTrail[i - 1]!.distance,
      );
  });

  it('follows independently of frame rate and keeps the entire viewport inside world bounds', () => {
    const viewport = {
      width: 960 / stageOne.camera.zoom,
      height: 540 / stageOne.camera.zoom,
    };
    const run = (fps: number) => {
      let focus = { x: 600, y: 500 };
      for (let i = 0; i < fps; i++)
        focus = followTrailCamera(
          focus,
          { x: 1600, y: 1000 },
          1 / fps,
          stageOne.world,
          viewport,
          stageOne.camera.deadzone,
          stageOne.camera.followRate,
        );
      return focus;
    };
    expect(run(30).x).toBeCloseTo(run(120).x, 6);
    const edge = followTrailCamera(
      { x: -999, y: 99999 },
      { x: -999, y: 99999 },
      1,
      stageOne.world,
      viewport,
      stageOne.camera.deadzone,
      9,
    );
    expect(edge.x - viewport.width / 2).toBeGreaterThanOrEqual(0);
    expect(edge.y + viewport.height / 2).toBeLessThanOrEqual(
      stageOne.world.height,
    );
  });
});
