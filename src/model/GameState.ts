import { Player } from "./Player";
import { TileParam } from "./Tile";
import { Vector2 } from "./Vector2";
import { createStore } from "solid-js/store";
import { WorldObject } from "./Object";

export type WorldEntity = {
  /** Actual position in pixels */
  position: Vector2;
};

export type GameState = {
  base: string;

  myPlayer: Player | null;
  earshotRadius: number;

  /** Remote players */
  remotePlayers: Player[];
  
  /** (Interactive) objects */
  objects: WorldObject[];

  /** The object nearby */
  currentObject?: WorldObject;
 
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
  activeTool?: TileParam; // and object

  /** Whether the game has focus or not */
  focused: boolean;

  // TODO: admin mode derived from `useParticipants`
};

export const [gameState, setGameState] = createStore<GameState>({
    base: "",

    myPlayer: null,
    earshotRadius: 8,

    remotePlayers: [],
    objects: [],

    mapSize: { x: 0, y: 0 },
    cameraOffset: { x: 0, y: 0 },

    tileAttributes: {},

    focused: false,

    // For now: enable overlay (and allow edit mode)
    debugMode: true,
});
