import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { gameState, setGameState } from "../model/GameState";
import { useRoomContext } from "../solid-livekit";
import { type WorldObject } from "../model/Object";
import {
  LocalParticipant,
  ParticipantEvent,
  RoomEvent,
  type RemoteParticipant,
  type TextStreamHandler,
} from "livekit-client";
import { Vector2 } from "../model/Vector2";
import { AnimationState } from "../model/AnimationState";
import { useLocalParticipant } from "../utils/useLocalParticipant";
import { useRemoteParticipants } from "../utils/useRemoteParticipants";
import { Direction } from "../model/Direction";
import { loadRoomMetadata } from "./useLiveKitRoom";
import toast from "solid-toast";
import { tileSize } from "../model/Tile";
import { ObjectWorkerData, Outgoing } from "../model/WorkerMessage";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// TODO: migrate to better payload when completely working;
// i.e. differentiate between player physics (combined messages), player messages, and world/object manipulation
// for now, maintain compatibility with spatial-audio sample.
type NetworkPacket = 
  NetworkPosition |
  NetworkDirection |
  NetworkAnimation |
  NetworkObject;

type NetworkPosition = {
  channelId: "position";
  payload: Vector2;
}
type NetworkDirection = {
  channelId: "direction";
  payload: Direction;
}
type NetworkAnimation = {
  channelId: "animation";
  payload: AnimationState;
}
type NetworkObject = {
  channelId: "object";
  payload: ObjectWorkerData;
}

// Up, Down, Left, Right
const [keyboardBits, setKeyboardBits] = createSignal<[boolean, boolean, boolean, boolean, boolean]>([false, false, false, false, false]);
/**
 * Toggle arrow/direction bit
 *
 * @param bit Bits up down left right
 * @param flag Whether to enable or disable
 */
export const toggleBit = (bit: 0 | 1 | 2 | 3 | 4, flag: boolean) => {
  setKeyboardBits((p) => {
    if (p[bit] === flag) return p;

    const n = [...p] as typeof p;
    n[bit] = flag;
    return n;
  });
}

/** Direction bits in order of up, down, left, right */
export const inputBits = keyboardBits;


/**
 * Get random spawn point
 * @returns Array of Position and optional direction
 */
export const getRandomSpawnPosition = (): [Vector2, Direction | undefined] => {
  const spawnKeys = Object.keys(gameState.tileAttributes).filter((key) => gameState.tileAttributes[key].type === "spawn");

  if (spawnKeys.length) {
    const key = spawnKeys[Math.floor(Math.random() * spawnKeys.length)];
    const [x, y] = key.split(",").map((c) => parseInt(c));
    // @ts-ignore -- We filtered on portal: direction is part of it.
    return [{ x, y }, gameState.tileAttributes[key].direction];
  }

  // Last resort:
  return [{ x: 50, y: 50 }, "S"];
}

const findNearestObjectIndex = (x: number, y: number, radius: number): number | undefined => {
  let nearestObjectIndex: number | undefined = undefined;
  let nearestDistance = Infinity;

  // We have to iterate them all to find the nearest
  gameState.objects.forEach((object, idx) => {
    // Only interactive items..
    if (!object.uri && !object.activeImage) return;

    const distance = Math.hypot(object.position.x / tileSize - x, object.position.y / tileSize - y);
    if (distance > radius) return;
    if (distance > nearestDistance) return;
    nearestDistance = distance;
    nearestObjectIndex = idx;
  });

  return nearestObjectIndex;
}

let timer: number | undefined;

/**
 * GameState manager
 */
export const useGameStateManager = () => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant({ room: room() });
  const remoteParticipants = useRemoteParticipants();

  createEffect(() => {
    // Don't do anything before we have a player
    if (!gameState.myPlayer) return;
    // Either index 1 or 2 (N/S), and 3 or 4 (E/W) apply
    const b = keyboardBits();
    const lat = (b[0] && !b[1]) ? "N" : (b[1] && !b[0]) ? "S" : "";
    const lon = (b[3] && !b[2]) ? "E" : (b[2] && !b[3]) ? "W" : "";
    const direction = (`${lat}${lon}` || undefined) as Direction | undefined;

    if (direction) {
      setGameState("myPlayer", "direction", direction);
      setGameState("myPlayer", "animation", "walk");
    } else {
      setGameState("myPlayer", "animation", "idle");
    }

    const doWalk = () => {
      if (!gameState.myPlayer?.targetPos) return; // Sanity check

      const { x, y } = gameState.myPlayer.targetPos;
      let newX = x
      let newY = y;
      if (gameState.myPlayer?.direction.includes("E")) {
        newX++;
      } else if (gameState.myPlayer?.direction.includes("W")) {
        newX--;
      }
      if (gameState.myPlayer?.direction.includes("S")) {
        newY++;
      } else if (gameState.myPlayer?.direction.includes("N")) {
        newY--;
      }

      // Try all combinations of x/y
      tryGo(newX,newY) || tryGo(newX,y) || tryGo(x,newY);
    };

    const tryGo = (x: number, y: number): boolean => {
      const tileAttribute = gameState.tileAttributes[`${x},${y}`];

      // Handle impassible state before actually updating.
      if (!gameState.editMode
        && tileAttribute?.type === "impassable"
        && tileAttribute.direction !== gameState.myPlayer?.direction) {
          return false
      }
      
      setGameState("myPlayer", "targetPos", {x, y});
      return true;
    };

    // TODO 32px per 100ms = 23px diagonal or per 141ms
    if (direction && !timer) {
      timer = window.setInterval(doWalk, 100);
    } else if (!direction) {
      clearInterval(timer);
      timer = undefined;
    }
  })

  // Drawing tile attributes or objects on the map
  createEffect(
    on<[number | undefined,number | undefined, boolean], void>(
      () => [gameState.myPlayer?.targetPos?.x, gameState.myPlayer?.targetPos?.y, keyboardBits()[4]],
      ([x, y, a]) => {
        if (!gameState.editMode || !a || x === undefined || y === undefined) return;

        // Used for level developing
        const idx = findNearestObjectIndex(x, y, 2);

        // Handle object
        if (gameState.activeTool?.type === "object") {
          // TODO: make sure we don't write multiple objects on the same location
          // Make a copy since unwrap and untrack don't work as I expect it to be.
          if (idx !== undefined &&
            gameState.objects[idx].position.x === x &&
            gameState.objects[idx].position.y === y)
            return;

          const object = setupObject(JSON.parse(JSON.stringify(gameState.activeTool)), gameState.objects.length, x * tileSize, y * tileSize, localParticipant());
          setGameState("objects", (objects) => [...objects, object]);
        } else {
          const key = `${x},${y}`
          // @ts-ignore -- Undefined means remove from store object. Otherwise, make a copy since unwrap and untrack don't work as I expect it to be.
          setGameState("tileAttributes", key, gameState.activeTool ? JSON.parse(JSON.stringify(gameState.activeTool)) : undefined);

          // Handle object delete
          if (idx) {
            // Kill worker thread, if active
            console.info("Terminating");
            gameState.objects[idx].worker?.terminate();
            setGameState("objects", (objects) => objects.filter((o,i) => i !== idx));
          }
        }
      }
    ),
  );

  // Action 'x' command
  createEffect(
    on<[number | undefined,number | undefined, boolean], void>(
      () => [gameState.myPlayer?.targetPos?.x, gameState.myPlayer?.targetPos?.y, keyboardBits()[4]],
      ([x, y, a]) => {
        if (gameState.editMode || x === undefined || y === undefined) return;

        // Determine if we need to display or hide a popup
        const idx = findNearestObjectIndex(x, y, 2);
        const nearestObject = gameState.objects[idx]
        if (nearestObject !== gameState.currentObject) {
          // Erase first (there are issues of other objects disappearing and toggling)
          setGameState("currentObject", undefined);
          setGameState("currentObject", nearestObject);
        }
 
        // Toggle active
        if (a && gameState.currentObject) {
          if (gameState.currentObject.worker) {
            gameState.currentObject.worker.postMessage({ type: "trigger", payload: gameState.currentObject.active } as Outgoing);
          } else {
            setGameState("currentObject", "active", (prev) => !prev);
          }
        }
      }
    ),
  );

  onMount(() => {
    document.addEventListener("visibilitychange", async () => {
      setGameState("focused", !document.hidden);
      if (document.visibilityState === "visible") {
        // TODO: maybe only lock when cam or mic are on.
        await navigator.wakeLock.request("screen");
      }
    });

    const keyboardEvent = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const down = event.type === "keydown";
      // TODO: We might want to include all items with focus and tabindex
      const isInput = ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "");
      if (down && isInput) return;

      // Compatible with other layouts using `code`
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          // Up
          toggleBit(0, down);
          break;
        case "KeyS":
        case "ArrowDown":
          // Down
          toggleBit(1, down);
          break;
        case "KeyA":
        case "ArrowLeft":
          // Left
          toggleBit(2, down);
          break;
        case "KeyD":
        case "ArrowRight":
          // Right
          toggleBit(3, down);
          break;
        case "KeyX":
          // Action
          toggleBit(4, down);
          break;
        case "KeyT":
          if (!down && !isInput)
            setGameState("chatMode", true);
      }

      // Hacky keyboard shortcuts
      if (!gameState.editMode || !down) return;
      switch (event.code) {
        case "Digit1":
          setGameState("activeTool", { type: "impassable" });
          break;
        case "Digit2":
          setGameState("activeTool", { type: "spawn" });
          break;
        case "Digit3":
          setGameState("activeTool", { type: "portal" });
          break;
        case "Digit4":
          setGameState("activeTool", { type: "private" });
          break;
        case "Digit5":
          setGameState("activeTool", { type: "spotlight" });
          break;
        case "Digit6":
          setGameState("activeTool", {
            type: "object",
            image: "world/boombox_off.png",
            activeImage: "world/boombox_on.png",
            mediaType: "s",
            uri: "scripts/sharedActive.js",
          });
          break;
        case "Delete":
          setGameState("activeTool", undefined);
          break;

        default:
          // Pass
      }
    };

    document.body.addEventListener("keydown", keyboardEvent);
    document.body.addEventListener("keyup", keyboardEvent);

    onCleanup(() => {
      document.body.removeEventListener("keydown", keyboardEvent);
      document.body.removeEventListener("keyup", keyboardEvent);
    })
  });

  // Remote participants
  createEffect(
    on(
      remoteParticipants,
      (currentParticipants, prevParticipants) => {
      const foundParticipants = new Set();
      const idx: number[] = [];
      currentParticipants.forEach((participant, i) => {
        // Found; add to used list
        foundParticipants.add(participant.identity);
        idx.unshift(i);

        if (gameState.myPlayer && !prevParticipants?.includes(participant)) {
          // Send it after room sync is completed
          participant.once(ParticipantEvent.Active, () => {
            console.info("Send mypos to", participant.identity);
            const position: Uint8Array = textEncoder.encode(
              JSON.stringify({
                payload: {
                  x: gameState.myPlayer!.targetPos!.x,
                  y: gameState.myPlayer!.targetPos!.y
                },
                channelId: "position" // TODO: differentiate between teleport and walk
              })
            );
            const direction: Uint8Array = textEncoder.encode(
              JSON.stringify({
                payload: gameState.myPlayer!.direction,
                channelId: "direction",
              }),
            );

            localParticipant().publishData(position, { destinationIdentities:[participant.identity] }); // packet kind unreliable by default
            localParticipant().publishData(direction, { destinationIdentities:[participant.identity] }); // packet kind unreliable by default
          });
        }

        const { character } = participant.attributes;

        const player = gameState.remotePlayers.findIndex(r => r.username === participant.identity);
        if (player !== -1 && character) {
          setGameState("remotePlayers", player, "character", character);
        } else if (character) {
          setGameState("remotePlayers", (items) => [
            ...items,
            {
              username: participant.identity,
              position: { x: 10, y: 0 },
              animation: "idle",
              character,
              direction: "S",
            }
          ]);
        }
      });

      // Cleanup disconnected players
      setGameState("remotePlayers", (items) => [...items.filter(p => foundParticipants.has(p.username))]);
    })
  );

  // Incoming data
  createEffect(() => {
    if (!localParticipant() || !room()) return;

    room()!.on(RoomEvent.DataReceived, onDataChannel);
    room()!.on(RoomEvent.RoomMetadataChanged, onMetadata);
    room()!.registerTextStreamHandler("", onChat)


    onCleanup(() => {
      room()!.off(RoomEvent.DataReceived, onDataChannel);
      room()!.off(RoomEvent.RoomMetadataChanged, onMetadata);
      room()!.unregisterTextStreamHandler("");
    })
  });

  // Connection handler
  createEffect(() => {
    localParticipant().on(ParticipantEvent.Active, onConnected);

    onCleanup(() => {
    localParticipant().off(ParticipantEvent.Active, onConnected);
    })
  });

  // (Re)Connected
  const onConnected = () => {
    console.info("Connected");
    const { character } = localParticipant().attributes;
    if (!character) console.warn("missing player character");
    if (!localParticipant().identity) console.warn("missing player identity");

    // Load the room details from the metadata
    loadRoomMetadata(room());

    const [targetPos, direction] = getRandomSpawnPosition();

    // Create
    setGameState("myPlayer", {
        username: localParticipant().identity,
        position: {x: targetPos.x * tileSize, y: targetPos.y * tileSize},
        targetPos,
        animation: "idle",
        character,
        direction,
    });
  }

  /**
   * Incoming messages
   * @param payload 
   * @param participant 
   * @returns 
   */
  const onDataChannel = (payload: Uint8Array, participant: RemoteParticipant | undefined) => {
    if (!participant) return;

    const player = gameState.remotePlayers.findIndex((player) => {
      return player.username === participant.identity;
    });

    // TODO: when filtered, we might need to add it.
    if (player === -1) return;

    const data = JSON.parse(textDecoder.decode(payload)) as NetworkPacket;
    switch (data.channelId) {
      case "position":
        // TODO: maybe filter out players that are outside of the view; maintain animation when appearing.
        setGameState("remotePlayers", player, "targetPos", data.payload);
        // TODO: differentiate between teleport and walk
        // setGameState("remotePlayers", player, "position", { x: data.payload.x * tileSize, y: data.payload.y * tileSize });
        break;

      case "animation":
        setGameState("remotePlayers", player, {
          animation: data.payload
        });
        break;

      case "direction":
        setGameState("remotePlayers", player, {
          direction: data.payload
        });
        break;

      case "object":
        setGameState("objects", data.payload.id, "active", data.payload.active);
        break;

      // case "message"
      // case "character"|"username" // Name change, etc
      default:
        // Pass
        console.info("Unknown incoming message: ", textDecoder.decode(payload))
    }
  };

  const onMetadata = (metadata: string) => {
    console.info("New metadata");
    loadRoomMetadata(room())
  }

  // Incoming chat
  const onChat: TextStreamHandler = async (reader, participant) => {
    const text = await reader.readAll();
    toast(`${participant.identity}: ${text}`, { duration: 10000 })
  };

  // Publish position
  createEffect(() => {
    if (!gameState.myPlayer?.position) return;
    const payload: Uint8Array = textEncoder.encode(
      JSON.stringify({
        payload: {
          x: gameState.myPlayer.targetPos?.x,
          y: gameState.myPlayer.targetPos?.y
        },
        channelId: "position"
      })
    );

    localParticipant().publishData(payload); // packet kind unreliable by default
  });

  // Publish direction
  createEffect(() => {
    if (!gameState.myPlayer?.direction) return;

    const payload: Uint8Array = textEncoder.encode(
      JSON.stringify({
        payload: gameState.myPlayer.direction,
        channelId: "direction",
      }),
    );
    localParticipant().publishData(payload); // packet kind unreliable by default
  });

  // Publish animation
  createEffect(() => {
    if (!gameState.myPlayer?.animation) return;

    const payload: Uint8Array = textEncoder.encode(
      JSON.stringify({
        payload: gameState.myPlayer.animation,
        channelId: "animation",
      }),
    );

    localParticipant().publishData(payload); // packet kind unreliable by default
  });
};

/**
 * Setup object from different types of data
 */
export const setupObject = (partialObject: Partial<WorldObject>, id: number, x: number, y: number, participant: LocalParticipant): WorldObject => {
  partialObject.position = { x, y };

  // Handle worker thread if needed
  if (partialObject.mediaType === "s") {
    
    // TODO: types
    partialObject.worker = new Worker(`world/${gameState.base}${partialObject.uri}`, { type: "classic" });

    partialObject.worker.addEventListener("message", ( {data} ) => {
      if (data.broadcast) {
        // 
        const payload: Uint8Array = textEncoder.encode(
          JSON.stringify({
            payload: {
              id,
              active: data.active,
            } as ObjectWorkerData,
            channelId: "object"
          })
        );
        participant.publishData(payload); // packet kind unreliable by default
        setGameState("objects", id, "active", data.active);

      }
    })
  }

  return partialObject as WorldObject;
}
