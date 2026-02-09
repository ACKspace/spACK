import { Player } from "./Player";
import { TileParam } from "./Tile";
import { Vector2 } from "./Vector2";
import { createStore } from "solid-js/store";

export type GameState = {
  myPlayer: Player | null;
  earshotRadius: number;

  remotePlayers: Player[];
  
  // TODO: objects similar to Player

  /** Map size in tile units, determined on image load */
  mapSize: Vector2;

  /** Camera offset in (negative) pixels to pan the map */
  cameraOffset: Vector2;

  /** Tile attributes addressed by "x,y" for faster lookup */
  tileAttributes: Record<string, TileParam>;

  /** Whether the user is in chat input mode */
  chatMode?: boolean;

  /** Whether the "game" is in debug mode (OSD stats) */
  debugMode?: boolean;

  /** Whether the "game" is in edit mode */
  editMode?: boolean;
  /** Current active painter's tool */
  activeTool?: TileParam;
};

export const [gameState, setGameState] = createStore<GameState>({
    myPlayer: null,
    earshotRadius: 8,

    remotePlayers: [],

    mapSize: { x: 0, y: 0 },
    cameraOffset: { x: 0, y: 0 },

    tileAttributes: {},

    // For now: enable overlay (and allow edit mode)
    debugMode: true,
});
