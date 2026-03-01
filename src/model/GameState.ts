import { Room } from 'livekit-client';
import { Player } from "./Player";
import { MetaType, TileAttribute, TileMetaData, TileParam, tileSize } from "./Tile";
import { Vector2 } from "./Vector2";
import { createStore } from "solid-js/store";
import { GenericMetaData, ObjectMeta, ObjectMetaData, WorldObject } from "./Object";
import { batch } from "solid-js";
import { Direction } from "readline";
import { setRoomMetaData } from "../utils/token";
import toast from "solid-toast";
import { setupObject } from '../utils/useGameStateManager';

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

type RoomMetaData = TileMetaData & ObjectMetaData & GenericMetaData;

const keyLookup: Record<keyof RoomMetaData, TileAttribute | "object" | string | number> = {
  A: "spotlight",
  B: false, // base
  D: "portal",
  E: false, // earshotradius
  I: "impassable",
  M: false, // debugmode
  O: "object",
  P: "private",
  S: "spawn",
  U: false, // updated
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

export const clearGameState = () => {
  const keys = Object.keys(gameState.tileAttributes);

  batch(() => {
    setGameState("base", "");
    setGameState("earshotRadius", 10); // TODO: leave out?
    setGameState("debugMode", true); // TODO: leave out?

    keys.forEach((key) => {
      // @ts-ignore -- Erase all old tiles
      setGameState("tileAttributes", key, undefined);
    });

    // Erase all objects and its workers. Kill any worker thread.
    gameState.objects.forEach((object) => {
      object.worker?.terminate();
    });
    setGameState("objects", []);
  });
};

/**
 * Load room meta data
 * @param room The LiveKit room
 * @returns 
 */
export const loadRoomMetadata = (room?: Room) => {
  if (!room?.metadata) return;

  clearGameState();

  try {
    const metadata = JSON.parse(room.metadata!) as RoomMetaData;
    const subTypes = Object.keys(metadata) as Array<keyof RoomMetaData>;

    batch(() => {
      if (metadata.B) setGameState("base", `${metadata.B}/`);
      if (metadata.E) setGameState("earshotRadius", metadata.E);
      if (metadata.M) setGameState("debugMode", true);
      // if (metadata.U) setGameState("updated", metadata.U); // TODO: trigger reload

      subTypes.forEach((subType) => {
        const type = keyLookup[subType];
        if (!type) return; // Sanity check

        metadata[subType].forEach((meta, index) => {
          const key = `${meta[0]},${meta[1]}`;
          // @ts-ignore -- Partial object; filled in with switch statement.
          const attribute: TileParam = { type }
          switch (attribute.type) {
            case "spawn":
            case "impassable":
              attribute.direction = meta[2] as Direction;
              break;

            case "portal":
              attribute.direction = meta[2] as Direction;
              attribute.room = meta[3];
              if (meta.length > 5) {
                attribute.coordinate = { x: meta[4]!, y: meta[5]!}
              }
              break;

            case "private":
            case "spotlight":
              attribute.identifier = meta[2] as string;
              break;

            case "object":
              // Not a tile attribute
              const partialObject = {
                  image: meta[2],
                  activeImage: meta[3] || undefined,
                  mediaType: meta[4] || undefined,
                  uri: meta[5] || undefined,
              } as WorldObject;

              const object = setupObject(partialObject, index, meta[0] * tileSize, meta[1] * tileSize, room.localParticipant);
              setGameState("objects", index, object);
              // Don't continue
              return;

            default:
              console.warn("Unknown type", type);
              break;
          }
          // Set the actual attribute
          setGameState("tileAttributes", key, attribute);
        });
      });
    });
  } catch (e) {
    console.warn("Failed to parse room meta data:", e);
  }
};


/**
 * Save room meta data
 * @param room The LiveKit room
 * @returns void
 */
export const saveRoomMetadata = async (room?: Room) => {
  if (!room) return;

  const metadata: RoomMetaData = {
    A: [],
    D: [],
    I: [],
    P: [],
    S: [],
    O: [],
    E: gameState.earshotRadius,
  };

  if (gameState.base) metadata.B = gameState.base.replace("/","");
  if (gameState.debugMode) metadata.M = 1;

  const keys = Object.keys(gameState.tileAttributes);

  keys.forEach((key) => {
    const metaChunk = key.split(",").map(axis => parseInt(axis)) as MetaType;
    const attribute = gameState.tileAttributes[key];
    switch (attribute.type) {
      case "impassable":
        // Direction is optional; make sure not to push undefined values to save space.
        if (attribute.direction) metaChunk.push(attribute.direction);
        // @ts-ignore -- TODO: fix typing.
        metadata.I.push(metaChunk);
        break;
      case "portal":
        // Most are optional, but either room or coordinate is required
        // TODO: make sure not to skip elements when coordinate is provided
        metaChunk.push(attribute.direction);
        metaChunk.push(attribute.room)
        metaChunk.push(attribute.coordinate.x)
        metaChunk.push(attribute.coordinate.y)
        metadata.D.push(metaChunk);
        break;
      case "private":
        // Identifier is mandatory
        metaChunk.push(attribute.identifier);
        metadata.P.push(metaChunk)
        break;
      case "spawn":
        // Direction is optional
        if (attribute.direction) metaChunk.push(attribute.direction);
        // @ts-ignore -- TODO: fix typing.
        metadata.S.push(metaChunk);
        break;
      case "spotlight":
        // Identifier is mandatory
        metaChunk.push(attribute.identifier);
        metadata.A.push(metaChunk)
        break;
    }
  });

  gameState.objects.forEach((obj) => {
    const metaChunk: ObjectMeta = [obj.position.x / tileSize, obj.position.y / tileSize, obj.image];
    // TODO: make sure not to skip elements
    metaChunk.push(obj.activeImage ?? 0);
    metaChunk.push(obj.mediaType ?? 0);
    metaChunk.push(obj.uri ?? 0);
    metadata.O.push(metaChunk);
  })

  const bytes = await setRoomMetaData(room.name, JSON.stringify(metadata));
  if (bytes)
    toast.success(`Saved metadata (${bytes} bytes)`);
  else
    toast.error("Unable to save metadata");
};

/**
 * Download room meta data for upload in a dedicated room directory
 * @param room The room we want to generate the JSON for
 * @returns void
 */
export const downloadRoomMetadata = async (room?: Room) => {
  if (!room) return;
  const metadata = {
    base: gameState.base.replace("/",""),
    earshotRadius: gameState.earshotRadius,
    objects: JSON.parse(JSON.stringify(gameState.objects)), // Make a copy so we can modify
    tileAttributes: gameState.tileAttributes, //JSON.parse(JSON.stringify(gameState.tileAttributes)),
    debugMode: gameState.debugMode,
  };

  (metadata.objects as WorldObject[]).forEach((obj) => {
    delete obj.worker;
    obj.position.x /= tileSize;
    obj.position.y /= tileSize;
  })


  // TODO: correct object position, remove worker

  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'text/plain' });
  const link = document.createElement("a");
  link.download = "metadata.json";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}