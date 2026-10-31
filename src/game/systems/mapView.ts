export interface MapView {
  zoom: number;
  x: number;
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}
export interface MapPoint {
  x: number;
  y: number;
}

export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 3;

/** Translation is measured in logical viewport units, after zoom. */
export function clampMapView(view: MapView, size: MapSize): MapView {
  const zoom = Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, view.zoom));
  return {
    zoom,
    x: Math.min(0, Math.max(size.width * (1 - zoom), view.x)),
    y: Math.min(0, Math.max(size.height * (1 - zoom), view.y)),
  };
}

export function panMapView(
  view: MapView,
  size: MapSize,
  delta: MapPoint,
): MapView {
  return clampMapView(
    { ...view, x: view.x + delta.x, y: view.y + delta.y },
    size,
  );
}

/** Keep the world point under an anchor stable, also allowing a pinch midpoint to move. */
export function zoomMapView(
  view: MapView,
  size: MapSize,
  requestedZoom: number,
  anchor: MapPoint,
  destination: MapPoint = anchor,
): MapView {
  const zoom = Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, requestedZoom));
  const ratio = zoom / view.zoom;
  return clampMapView(
    {
      zoom,
      x: destination.x - (anchor.x - view.x) * ratio,
      y: destination.y - (anchor.y - view.y) * ratio,
    },
    size,
  );
}
