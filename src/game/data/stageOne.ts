import layout from '../../../public/assets/maps/stage-1-1/layout.json';
import { sampleTrail } from '../systems/trail';

export const stageOne = layout;
export const stageOneTrail = sampleTrail(
  layout.road.controlPoints,
  layout.road.samplesPerSegment,
);

export interface SpriteIndex {
  image: string;
  frameWidth: number;
  frameHeight: number;
  anchor: { x: number; y: number };
  restBodyHeight: number;
  animations: Record<
    string,
    { frames: number[]; frameRate: number; repeat: number }
  >;
}

export interface EnvironmentProp {
  id: string;
  texture: string;
  image: string;
  x: number;
  y: number;
  height: number;
  anchor: { x: number; y: number };
  sourceHeight: number;
  radius?: number;
}
