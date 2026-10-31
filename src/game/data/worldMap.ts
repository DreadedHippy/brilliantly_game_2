export interface MapRegion {
  id: string;
  name: string;
  map_position: { x: number; y: number };
  codex_unlocked: boolean;
}

interface MapAsset {
  path: string;
  width: number;
  height: number;
}

export interface WorldMapIndex {
  coordinate_system: { width: number; height: number };
  assets: Record<string, MapAsset>;
  regions: MapRegion[];
}

let worldMap: WorldMapIndex;
const regionsById = new Map<string, MapRegion>();

export function initializeWorldMap(index: WorldMapIndex): void {
  if (
    !index ||
    !Array.isArray(index.regions) ||
    !index.coordinate_system ||
    !index.assets
  ) {
    throw new Error('The world map index is missing or invalid.');
  }
  worldMap = index;
  regionsById.clear();
  for (const region of index.regions) {
    if (regionsById.has(region.id) || !region.map_position)
      throw new Error('Invalid region position or duplicate region ID.');
    regionsById.set(region.id, region);
  }
}

export function getWorldMap(): WorldMapIndex {
  return worldMap;
}

export function getMapRegion(id: string): MapRegion {
  const region = regionsById.get(id);
  if (!region) throw new Error(`Region is missing from the map index: ${id}`);
  return region;
}
