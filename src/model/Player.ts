import { Vector2 } from "./Vector2";
import { type AnimationState } from "./AnimationState";
import { Direction } from "./Direction";
import { WorldEntity } from "./GameState";
import { ImageSource } from "../../solid-canvas/src/types";

export type Player<T extends string = string> = WorldEntity & {
  /** Participant identity */
  username: string;
  /** Desired position in tile units */
  targetPos?: Vector2;
  /** Animation state */
  animation: AnimationState;
  /** Character */
  character: T;
  /** Direction to look */
  direction: Direction;
  /** Speaking */
  speaking?: boolean;
  /** Private tile mode */
  private?: string;
};

export type PlayerProps<T extends string = string> = {
  /** Offset within the map in pixels */
  position: Vector2;
  speaking?: boolean;
  username: string;
  animation: AnimationState;
  character: T;
  direction: Direction;
};

export type SpriteInfo = {
  image: ImageSource;
  rows: number;
  cols: number;
  width: number;
  height: number;
  animations: Record<AnimationState, number[]>;
}
