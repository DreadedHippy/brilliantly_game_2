import { describe, expect, it } from 'vitest';
import {
  clampMapView,
  panMapView,
  zoomMapView,
} from '../../src/game/systems/mapView';

const size = { width: 960, height: 540 };
const initial = { zoom: 1, x: 0, y: 0 };

describe('map viewport', () => {
  it('keeps the world point under the cursor fixed when zooming', () => {
    const view = { zoom: 2, x: -440, y: -320 };
    const anchor = { x: 340, y: 200 };
    const next = zoomMapView(view, size, 2.5, anchor);
    expect((anchor.x - next.x) / next.zoom).toBeCloseTo(
      (anchor.x - view.x) / view.zoom,
    );
    expect((anchor.y - next.y) / next.zoom).toBeCloseTo(
      (anchor.y - view.y) / view.zoom,
    );
    expect(view).toEqual({ zoom: 2, x: -440, y: -320 });
  });

  it('supports a moving midpoint during a pinch', () => {
    const next = zoomMapView(
      initial,
      size,
      1.5,
      { x: 480, y: 270 },
      { x: 500, y: 290 },
    );
    expect(next).toEqual({ zoom: 1.5, x: -220, y: -115 });
  });

  it('clamps extreme pan and zoom without exposing space beyond the map', () => {
    expect(clampMapView({ zoom: 20, x: -10000, y: 10000 }, size)).toEqual({
      zoom: 3,
      x: -1920,
      y: 0,
    });
    expect(
      panMapView({ zoom: 2, x: -200, y: -200 }, size, { x: 10000, y: -10000 }),
    ).toEqual({ zoom: 2, x: 0, y: -540 });
  });

  it('recenters completely when returning to the fitted view', () => {
    expect(
      zoomMapView({ zoom: 3, x: -900, y: -600 }, size, 0.1, { x: 700, y: 400 }),
    ).toEqual(initial);
    expect(panMapView(initial, size, { x: -100, y: 100 })).toEqual(initial);
  });

  it('is independent of pointer event frequency', () => {
    const start = zoomMapView(initial, size, 2, { x: 480, y: 270 });
    const singleMove = panMapView(start, size, { x: 100, y: -80 });
    let manyMoves = start;
    for (let i = 0; i < 10; i += 1)
      manyMoves = panMapView(manyMoves, size, { x: 10, y: -8 });
    expect(manyMoves).toEqual(singleMove);
  });
});
