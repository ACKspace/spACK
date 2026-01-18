import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { gameState, setGameState } from "../model/GameState";
import { useRoomContext } from "../solid-livekit";

import {
  ParticipantEvent,
  RemoteParticipant,
  RoomEvent,
} from "livekit-client";
import { Vector2 } from "../model/Vector2";
import { AnimationState } from "../model/AnimationState";
import { Player } from "../model/Player";
import { useLocalParticipant } from "../utils/useLocalParticipant";
import { useRemoteParticipants } from "../utils/useRemoteParticipants";
import { Direction } from "../model/Direction";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// TODO: migrate to better payload when completely working;
// i.e. differentiate between player physics (combined messages), player messages, and world/object manipulation
// for now, maintain compatibility with spatial-audio sample.
type NetworkPacket = 
  NetworkPosition |
  NetworkDirection |
  NetworkAnimation;

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

let timer: number | undefined;
export const useGameStateManager = () => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant({ room: room() });
  const remoteParticipants = useRemoteParticipants();

  // Up, Down, Left, Right
  const [arrowBits, setArrowBits] = createSignal<[boolean, boolean, boolean, boolean]>([false, false, false, false]);
  const toggleBit = (bit: 0 | 1 | 2 | 3, flag: boolean) => {
    setArrowBits((p) => {
      const n = [...p] as typeof p;
      n[bit] = flag;
      return n;
    });
  }

  createEffect(() => {
    // Don't do anything before we have a player
    if (!gameState.myPlayer) return;
    // Either index 1 or 2 (N/S), and 3 or 4 (E/W) apply
    const b = arrowBits();
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
      if (!gameState.myPlayer?.position) return; // Sanity check

      let {x, y } = gameState.myPlayer.position;
      if (gameState.myPlayer?.direction.includes("E")) {
        x++;
      } else if (gameState.myPlayer?.direction.includes("W")) {
        x--;
      }
      if (gameState.myPlayer?.direction.includes("S")) {
        y++;
      } else if (gameState.myPlayer?.direction.includes("N")) {
        y--;
      }
      setGameState("myPlayer", "position", {x, y});
    };

    // TODO 32px per 100ms = 23px diagonal or per 141ms
    if (direction && !timer) {
      timer = setInterval(doWalk, 100);
    } else if (!direction) {
      clearInterval(timer);
      timer = undefined;
    }
  })

  onMount(() => {
    const keyboardEvent = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const down = event.type === "keydown";

      // Compatible with other layouts using `code`
      switch (event.code) {
        case "KeyW":
        case "KeyI":
        case "ArrowUp":
          // Up
          toggleBit(0, down);
          break;
        case "KeyS":
        case "KeyK":
        case "ArrowDown":
          // Down
          toggleBit(1, down);
          break;
        case "KeyA":
        case "KeyJ":
        case "ArrowLeft":
          // Left
          toggleBit(2, down);
          break;
        case "KeyD":
        case "KeyL":
        case "ArrowRight":
          // Right
          toggleBit(3, down);
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
      () => {
      const foundParticipants = new Set();
      const idx: number[] = [];
      remoteParticipants().forEach((participant, i) => {
        // Found; remove from unused list
        foundParticipants.add(participant.identity);
        idx.unshift(i);

        const { character } = JSON.parse(participant.metadata!) as Player;

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

    onCleanup(() => {
      room()!.off(RoomEvent.DataReceived, onDataChannel);
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
    console.log("Connected");
    const { character } = JSON.parse(localParticipant().metadata!) as Player;
    if (!character) console.warn("missing player character");
    if (!localParticipant().identity) console.warn("missing player identity");

    // Create
    setGameState("myPlayer", {
        username: localParticipant().identity,
        position: { x: 10, y: 0 }, // TODO: spawn point
        animation: "idle",
        character,
        direction: "S",
    });
  }

  // Incoming messages
  const onDataChannel = (payload: Uint8Array, participant: RemoteParticipant | undefined) => {
    // console.log("Incoming data", participant, textDecoder.decode(payload));
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
        setGameState("remotePlayers", player, "position", data.payload);
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

      // case "message"
      // case "character"|"username" // Name change, etc
      default:
        // Pass
        console.info("Incoming message: ", textDecoder.decode(payload))
    }
  };

  // Publish position
  createEffect(() => {
    if (!gameState.myPlayer?.position) return;
    const payload: Uint8Array = textEncoder.encode(
      JSON.stringify({
        payload: {
          x: gameState.myPlayer.position.x,
          y: gameState.myPlayer.position.y
        },
        channelId: "position"
      })
    );

    // console.log("update position", textDecoder.decode(payload));
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

    // console.log("update animation", textDecoder.decode(payload));
    localParticipant().publishData(payload); // packet kind unreliable by default
  });
};
