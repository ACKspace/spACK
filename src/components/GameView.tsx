import { gameState, setGameState } from "../model/GameState";
import { ConnectionState } from "livekit-client";
import { Component, createMemo, For, Show } from "solid-js";
import { useConnectionState, useRoomContext } from "../solid-livekit";
import { useGameStateManager } from "../utils/useGameStateManager";
import { Arc, Canvas, Image } from "../../solid-canvas/src";
import { Character } from "../canvas/Character";
import { Player } from "../model/Player";
import { SpatialAudioController } from "./SpatialAudioController";

const GameView: Component = () => {
  let ref!: HTMLDivElement;
  const connectionState = useConnectionState();

  useGameStateManager();
  const room = useRoomContext();

  const objects = createMemo<Array<Player>>(() => {
    if (!gameState.myPlayer) return [];

    // Sorted list of players/objects
    const objects = [
      gameState.myPlayer,
      ...gameState.remotePlayers,
      // gameState.objects,
    ].sort((a, b) => {
      if (a.position.y > b.position.y) return -1;
      if (a.position.y < b.position.y) return 1;

      if (a.position.x > b.position.x) return 1;
      if (a.position.x < b.position.x) return -1;

      // TODO: Players always on top of objects

      // Facing north means "on top" (for smooching, etc.)
      if (a.direction.includes("N") && b.direction.includes("S")) return -1;
      if (b.direction.includes("N") && a.direction.includes("S")) return 1;

      return 0;
    })

    return objects;
  })

  return (
    <Show when={connectionState() === ConnectionState.Connected} fallback={<>Not connected</>}>
      <Canvas
        imageSmoothingEnabled={false}
      >
        <For each={objects()}>{(player) => (
          // TODO: relative to own player/map
          <Character
            username={player.username}
            x={10 + player.position.x - (gameState.myPlayer?.position.x ?? 0)}
            y={10 + player.position.y - (gameState.myPlayer?.position.y ?? 0)}
            character={player.character}
            animation={player.animation}
            direction={player.direction}/>
        )}</For>
        <Arc
          transform={{
            // TODO: relative to own player/map
            position: {x: 320 - 32 * gameState.earshotRadius, y: 320 - 32 * gameState.earshotRadius}
          }}
          style={{
            radius: 32 * gameState.earshotRadius,
            fill: "rgba(255,255,255,0.1)",
            stroke: "none",
          }}
        />
        <Image
          onLoad={(image) => {
            // Determine level boundaries
            console.log(image.width || 0 / 32, image.height || 0 / 32)
          }}
          style={{
            sourceOffset: { x: ((gameState.myPlayer?.position.x ?? 0) + 40) * 32, y: ((gameState.myPlayer?.position.y ?? 0) + 40) * 32 },
            sourceDimensions: { width: 640, height: 640 },
            dimensions: { width: 640, height: 640 },
            pointerEvents: false,
          }}
          transform={{
            position: {x: 0, y: 0}
          }}
          image={"world/map.png"}
        />

      </Canvas>
      <div ref={ref} style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
        <SpatialAudioController/>
        {gameState.myPlayer?.direction}
        <button onClick={() => {
          // Placeholder for debug
        }}>console debug</button>
        <button onClick={() => setGameState("myPlayer", "position", { x: -1, y: -6 })}>@home</button>
      </div>
    </Show>
  );
};

export default GameView;
