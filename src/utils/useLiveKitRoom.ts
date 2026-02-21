import { Room, MediaDeviceFailure, RoomEvent, ConnectionState } from 'livekit-client';
import { type LiveKitRoomProps } from '../components/LiveKitRoom';
import { Accessor, batch, createEffect, createSignal, mergeProps, onCleanup } from 'solid-js';
import { TileMetaData, MetaType, TileAttribute, TileParam, tileSize } from '../model/Tile';
import { gameState, setGameState } from '../model/GameState';
import { setRoomMetaData } from './useToken';
import { Direction } from '../model/Direction';
import toast from "solid-toast";
import { GenericMetaData, ObjectMeta, ObjectMetaData } from '../model/Object';
import { setupObject } from './useGameStateManager';
import { type WorldObject } from "../model/Object";

const defaultRoomProps: Partial<LiveKitRoomProps> = {
  connect: true,
  audio: false,
  video: false,
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


/**
 * Use LiveKit room helper
 * @param props LiveKit room props
 * @returns 
 */
export function useLiveKitRoom<T extends HTMLElement>(
  props: LiveKitRoomProps,
): {
  room: Accessor<Room | undefined>;
} {
  const p = mergeProps(defaultRoomProps, props);
  
  if (p.options && p.room) {
    console.warn(
      'when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead.',
    );
  }

  const [room, setRoom] = createSignal<Room | undefined>();

  // set room if provided or create one when options are provided
  createEffect(() => {
    setRoom(p.room ?? new Room(p.options));
  });

  // TODO
  // Connect to room events
  createEffect(() => {
    if (!room()) return;
    const onSignalConnected = () => {
      const localP = room()!.localParticipant;

      console.debug('trying to publish local tracks');
      Promise.all([
        localP.setMicrophoneEnabled(!!p.audio, typeof p.audio !== 'boolean' ? p.audio : undefined),
        localP.setCameraEnabled(!!p.video, typeof p.video !== 'boolean' ? p.video : undefined),
        localP.setScreenShareEnabled(!!p.screen, typeof p.screen !== 'boolean' ? p.screen : undefined),
      ]).catch((e) => {
        console.warn(e);
        p.onError?.(e as Error);
      });
    };

    const onMediaDeviceError = (e: Error) => {
      const mediaDeviceFailure = MediaDeviceFailure.getFailure(e);
      p.onMediaDeviceFailure?.(mediaDeviceFailure);
    };
    room()!.on(RoomEvent.SignalConnected, onSignalConnected);
    room()!.on(RoomEvent.MediaDevicesError, onMediaDeviceError);

    onCleanup(() => {
      room()!.off(RoomEvent.SignalConnected, onSignalConnected);
      room()!.off(RoomEvent.MediaDevicesError, onMediaDeviceError);
    });
  });

  // Room connection logic
  createEffect(() => {
    if (!room()) return;

    // How many simulated participants
    if (p.simulateParticipants) {
      room()!.simulateParticipants({
        participants: {
          count: p.simulateParticipants,
        },
        publish: {
          audio: true,
          useRealTracks: true,
        },
      });
      return;
    }
    // Check token
    if (!p.token) {
      console.debug('no token yet');
      return;
    }
    // Check url
    if (!p.serverUrl) {
      console.warn('no livekit url provided');
      p.onError?.(Error('no livekit url provided'));
      return;
    }

    // Connect
    if (p.connect) {
      console.debug('connecting');
      room()!.connect(p.serverUrl, p.token, p.connectOptions).catch((e) => {
        console.warn(e);
        p.onError?.(e as Error);
      });
    } else {
      console.debug('disconnecting because connect is false');
      room()!.disconnect();
    }
  });

  // Room state event logic
  createEffect(() => {
    if (!room()) return;
    const connectionStateChangeListener = (state: ConnectionState) => {
      switch (state) {
        case ConnectionState.Disconnected:
          p.onDisconnected?.();
          break;
        case ConnectionState.Connected:
          p.onConnected?.();
          break;

        default:
          break;
      }
    };
    room()!.on(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    onCleanup(() => {
      room()!.off(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    });
  });

  // Cleanup
  createEffect(() => {
    if (!room()) return;
    onCleanup(() => {
      console.info('disconnecting on onmount');
      room()!.disconnect();
    });
  });

  return { room };
}


/**
 * Load room meta data
 * @param room The LiveKit room
 * @returns 
 */
export const loadRoomMetadata = (room?: Room) => {
  if (!room?.metadata) return;

  try {
    const metadata = JSON.parse(room.metadata!) as RoomMetaData;

    const keys = Object.keys(gameState.tileAttributes);
    batch(() => {
      if (metadata.B) setGameState("base", `${metadata.B}/`);
      if (metadata.E) setGameState("earshotRadius", metadata.E);
      if (metadata.M) setGameState("debugMode", true);
      // if (metadata.U) setGameState("updated", metadata.U); // TODO: trigger reload

      keys.forEach((key) => {
        // @ts-ignore -- Erase all old tiles
        setGameState("tileAttributes", key, undefined);
      });
    });

    // Erase all objects and its workers. Kill any worker thread.
    gameState.objects.forEach((object) => {
      object.worker?.terminate();
    })
    setGameState("objects", []);

    const subTypes = Object.keys(metadata) as Array<keyof RoomMetaData>;
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

  if (metadata.B) setGameState("base", `${metadata.B}/`);
  if (metadata.E) setGameState("earshotRadius", metadata.E);
  if (metadata.M) setGameState("debugMode", true);

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
    objects: gameState.objects, //JSON.parse(JSON.stringify(gameState.objects)),
    tileAttributes: gameState.tileAttributes, //JSON.parse(JSON.stringify(gameState.tileAttributes)),
    debugMode: gameState.debugMode,
  };

  // TODO: correct object position, remove worker

  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'text/plain' });
  const link = document.createElement("a");
  link.download = "metadata.json";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}