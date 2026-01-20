import { Player } from "./Player";
import { Vector2 } from "./Vector2";
import { createStore } from "solid-js/store";

export type GameState = {
  myPlayer: Player | null;
  earshotRadius: number;

  remotePlayers: Player[];
  
  // TODO: objects similar to Player

  /** Map size in tile units, determined on image load */
  mapSize: Vector2;

  /** Camera offset in pixels to account for tile rounding by the viewport of the canvas */
  cameraOffset: Vector2;
};

export const [gameState, setGameState] = createStore<GameState>({
    myPlayer: null,
    earshotRadius: 9,

    remotePlayers: [],

    mapSize: { x: 0, y: 0 },
    cameraOffset: { x: 0, y: 0 },
});
