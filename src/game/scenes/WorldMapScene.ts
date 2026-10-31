import Phaser from 'phaser';
import { levels } from '../data/levels';
import { getMapRegion, getWorldMap } from '../data/worldMap';
import { progress } from '../state';
import { showMap } from '../../ui/shell';
import { mountMapOverlay } from '../../ui/worldMap';
import { landscape } from './art';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('world-map');
  }

  preload(): void {
    const asset = getWorldMap().assets['world-backdrop'];
    if (asset && !this.textures.exists('world-backdrop')) {
      this.load.image(
        'world-backdrop',
        `${import.meta.env.BASE_URL}${asset.path}`,
      );
    }
  }

  create(): void {
    this.cameras.main.setOrigin(0, 0);
    const map = getWorldMap();
    const artworkLoaded = this.textures.exists('world-backdrop');
    if (artworkLoaded) {
      const art = this.add.image(480, 270, 'world-backdrop');
      // Uniform cover fit; never stretch the painted source to the viewport.
      art.setScale(
        Math.max(
          map.coordinate_system.width / art.width,
          map.coordinate_system.height / art.height,
        ),
      );
    } else {
      landscape(this);
    }
    const enter = (id: string): void => {
      const level = levels.find((candidate) => candidate.id === id);
      if (level)
        this.scene.start(
          level.id === 'river-crossing' ? 'stage-1-1' : 'exploration',
          { level },
        );
    };
    showMap(progress.completed, (level) => enter(level.id));
    const cleanup = mountMapOverlay(
      map,
      levels.map((level) => getMapRegion(level.id)),
      progress.completed,
      enter,
      artworkLoaded,
      (view) => {
        this.cameras.main.setZoom(view.zoom);
        this.cameras.main.setScroll(-view.x / view.zoom, -view.y / view.zoom);
      },
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  }
}
