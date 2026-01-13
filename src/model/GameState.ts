import { Player } from "./Player";
import { Vector2 } from "./Vector2";
import { createStore } from "solid-js/store";

export type GameState = {
  myPlayer: Player | null;
  earshotRadius: number;

  remotePlayers: Player[];
  
  // TODO: objects similar to Player

  worldBoundaries: { minX: number, maxX: number, minY: number, maxY: number };
  cameraOffset: Vector2;
};

export const [gameState, setGameState] = createStore<GameState>({
    myPlayer: null,
    earshotRadius: 300,

    remotePlayers: [],

    worldBoundaries: { minX: -775, maxX: 780, minY: -790, maxY: 770 },
    cameraOffset: { x: 0, y: 0 },
});
