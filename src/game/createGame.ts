import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { ExplorationScene } from './scenes/ExplorationScene';
import { BattleScene } from './scenes/BattleScene';
import { StageOneScene } from './scenes/StageOneScene';
import { palette } from './theme';

export function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 960,
    height: 540,
    backgroundColor: palette.ink,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [
      BootScene,
      WorldMapScene,
      StageOneScene,
      ExplorationScene,
      BattleScene,
    ],
  });
}
