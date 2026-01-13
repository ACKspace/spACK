import { Vector2 } from "./Vector2";
import { type AnimationState } from "./AnimationState";
import { type CharacterName } from "../components/CharacterSelector";
import { Direction } from "./Direction";

export type Player = {
  username: string;
  position: Vector2;
  animation: AnimationState;
  character: CharacterName;
  direction: Direction;
};
