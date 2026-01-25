import { gameState, setGameState } from "../model/GameState";
import { ConnectionState } from "livekit-client";
import { batch, Component, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { useConnectionState, useRoomContext } from "../solid-livekit";
import { useGameStateManager } from "../utils/useGameStateManager";
import { Canvas, Group } from "../../solid-canvas/src";
import { Character } from "../canvas/Character";
import { Map } from "../canvas/Map";
import { Player } from "../model/Player";
import { SpatialAudioController } from "./SpatialAudioController";
import { EarshotRadius } from "../canvas/EarshotRadius";
import { tileColors, tileSize } from "../model/Tile";
import { NavigationButtons } from "./NavigationButtons/NavigationButtons";
import { useMobile } from "../utils/useMobile";
import { AttributeTile } from "../canvas/AttributeTile";
import { loadRoomMetadata, saveRoomMetadata } from "../utils/useLiveKitRoom";
import Button from "./Button/Button";

const GameView: Component = () => {
  // Player on-screen center, dependent on window resize and possibly world boundaries
  const [center, setCenter] = createSignal({x: 10, y: 10});
  // Screen size in tile units, aligned per 2 tiles to center player, determined on window resize
  const [screen, setScreen] = createSignal({x: 0, y: 0});

  const mobile = useMobile();

  onMount(() => {
    const updateDimensions = () => {
      batch(() =>{
        // Calculate amount of squares and its remainder

        // Step 2 blocks to center our character
        setScreen({
          x: Math.floor(window.innerWidth / tileSize / 2) * 2,
          y: Math.floor(window.innerHeight / tileSize / 2) * 2,
        });

        setGameState("cameraOffset", {
          x: (window.innerWidth % (tileSize * 2)) / 2,
          y: (window.innerHeight % (tileSize * 2) / 2),

        })

        // TODO: take world boundary into account (walking on the edge)
        setCenter({
          x: screen().x / 2,
          y: screen().y / 2,
        });
      });
    }

    // For now, assume the canvas has the same size as the window.
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
  })

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
      <Canvas>
        <Show when={gameState.editMode}>
          <Group
            transform={{
              position: {x: gameState.cameraOffset.x, y: gameState.cameraOffset.y}
            }}
          >
            <For each={Object.keys(gameState.tileAttributes)}>{(key) => {
              const [x,y] = key.split(",").map(axis => parseInt(axis));
              const tile = gameState.tileAttributes[key];
              return <AttributeTile
                color={tileColors[tile.type]}
                position={{
                  x: center().x + x,
                  y: center().y + y,
                }}
                direction={tile.direction}
                />
            }}</For>
          </Group>
        </Show>
        <Map
          image={"world/overlay.png"}
          center={center()}
          screen={screen()}
          overlay
        />
        <Group
          transform={{
            position: {x: gameState.cameraOffset.x, y: gameState.cameraOffset.y}
          }}
        >
          <For each={objects()}>{(player) => (
            // TODO: relative to own player/map
            <Character
              username={player.username}
              x={center().x + player.position.x - (gameState.myPlayer?.position.x ?? 0)}
              y={center().y + player.position.y - (gameState.myPlayer?.position.y ?? 0)}
              character={player.character}
              animation={player.animation}
              direction={player.direction}/>
          )}</For>
          <EarshotRadius radius={gameState.earshotRadius} position={center()} render />
        </Group>
        <Map
          image={"world/map.png"}
          center={center()}
          screen={screen()}
        />
      </Canvas>
      <Show when={mobile}>
        <NavigationButtons/>
      </Show>
      <SpatialAudioController/>
      <Show when={gameState.debugMode}>
        <div style={{ position: "fixed", top: 0, left: 0 }}>
          player:{gameState.myPlayer?.position.x},{gameState.myPlayer?.position.y}<br/>
          screen:{screen().x},{screen().y}<br/>
          center:{center().x},{center().y}<br/>
          offset:{gameState.cameraOffset.x},{gameState.cameraOffset.y}<br/>
          map:{gameState.mapSize.x},{gameState.mapSize.x}<br/>
          <div>
            <Button onClick={() => {
              setGameState("editMode", !gameState.editMode);
            }}>{gameState.editMode ? "regular mode" : "edit mode"}</Button>
          </div>
          <Button onClick={() => setGameState("myPlayer", "position", { x: -1, y: -6 })}>@home</Button>
        </div>
        <Show when={gameState.editMode}>
          <div style={{ position: "fixed", bottom: 0, left: 0 }}>
            Tile selector/options..
            {gameState.activeTool?.type}
            <Button onClick={() => loadRoomMetadata(room())}>Load metadata</Button>
            <Button onClick={() => saveRoomMetadata(room())}>Save metadata</Button>
          </div>
        </Show>
      </Show>
    </Show>
  );
};

export default GameView;
