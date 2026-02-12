import { Vector2 } from "./Vector2";
import { type AnimationState } from "./AnimationState";
import { type CharacterName } from "../components/CharacterSelector/CharacterSelector";
import { Direction } from "./Direction";
import { WorldEntity } from "./GameState";

export type Player = WorldEntity & {
  /** Participant identity */
  username: string;
  /** Desired position in tile units */
  targetPos?: Vector2;
  /** Animation state */
  animation: AnimationState;
  /** Character */
  character: CharacterName;
  /** Direction to look */
  direction: Direction;
};
