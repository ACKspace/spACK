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
  NetworkAnimation;

type NetworkPosition = {
  channelId: "position";
  payload: Vector2;
}
type NetworkAnimation = {
  channelId: "animation";
  payload: AnimationState;
}

// Maintain compatibility with demo
const FACTOR = 32;

const directionToLeftRight = (direction: Direction): "left" | "right" => {
  switch (direction) {
    case "N":
    case "NE":
    case "E":
    case "SE":
      return "right";
    // S, SW, W, NW
    default:
      return "left"
  }
}

const leftRightToDirection = (legacyDirection: "left" | "right"): Direction => {
  return legacyDirection === "left" ? "W" : "E";
}

export const useGameStateManager = () => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant({ room: room() });
  const remoteParticipants = useRemoteParticipants();

  const [speed, setSpeed] = createSignal(0);

  onMount(() => {
    const keyboardEvent = (event: KeyboardEvent) => {
      // setGameState("remotePlayers", player, "character", character);
      // turn/walk/run(?)
      // gameState.myPlayer?.direction
      // gameState.myPlayer?.animation

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
              direction: "W",
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
        direction: "E",
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
        // Divide by 32 (tile size) for compatibility with demo
        const { x, y } = data.payload;
        setGameState("remotePlayers", player, "position", { x: Math.round( x / FACTOR), y: Math.round( y / FACTOR) });
        break;
      case "animation":
        const [animation, direction] = data.payload.split("_") as [AnimationState, "left" | "right"];

        setGameState("remotePlayers", player, {
          animation,
          direction: leftRightToDirection(direction)
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
          x: gameState.myPlayer.position.x * FACTOR,
          y: gameState.myPlayer.position.y * FACTOR
        },
        channelId: "position"
      })
    );

    // console.log("update position", textDecoder.decode(payload));
    localParticipant().publishData(payload); // packet kind unreliable by default
  });

  // Publish animation
  createEffect(() => {
    if (!gameState.myPlayer?.animation) return;

    // Note: backward compatibility 
    const payload: Uint8Array = textEncoder.encode(
      JSON.stringify({
        payload: `${gameState.myPlayer.animation}_${directionToLeftRight(gameState.myPlayer.direction)}`,
        channelId: "animation",
      }),
    );

    // console.log("update animation", textDecoder.decode(payload));
    localParticipant().publishData(payload); // packet kind unreliable by default
  });
};
