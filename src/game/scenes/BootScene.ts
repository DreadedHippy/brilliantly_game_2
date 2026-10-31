import Phaser from 'phaser';
import { courier } from './art';
import { initializeWorldMap, type WorldMapIndex } from '../data/worldMap';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.json(
      'world-map-index',
      `${import.meta.env.BASE_URL}assets/maps/world_map_codex.json`,
    );
  }

  create(): void {
    try {
      initializeWorldMap(
        this.cache.json.get('world-map-index') as WorldMapIndex,
      );
    } catch {
      const panel = document.querySelector('#panel');
      if (panel)
        panel.innerHTML =
          '<h2>Map unavailable</h2><p role="alert">The world map could not load. Check your connection and reload to try again.</p>';
      return;
    }
    courier(this);
    this.scene.start('world-map');
  }
}
