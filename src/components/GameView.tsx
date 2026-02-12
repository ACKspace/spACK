import { gameState, setGameState } from "../model/GameState";
import { ConnectionState } from "livekit-client";
import { batch, Component, createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { useConnectionState } from "../solid-livekit";
import { getRandomSpawnPosition, useGameStateManager } from "../utils/useGameStateManager";
import { Canvas, Group } from "../../solid-canvas/src";
import { Character } from "../canvas/Character";
import { Map } from "../canvas/Map";
import { Player } from "../model/Player";
import { SpatialAudioController } from "./SpatialAudioController";
import { EarshotRadius } from "../canvas/EarshotRadius";
import { tileSize } from "../model/Tile";
import { NavigationButtons } from "./NavigationButtons/NavigationButtons";
import { useMobile } from "../utils/useMobile";
import Button from "./Button/Button";
import TileSelector from "./Tiles/TileSelector";
import { TileInformation } from "./Tiles/TileInformation";
import { useLocalParticipant } from "../utils/useLocalParticipant";
import { AttributeTileGroup } from "../canvas/AttributeTileGroup";
import { Vector2 } from "../model/Vector2";
import { type Object } from "../model/Object";
import { useCurrentTileAttribute } from "../utils/useCurrentTileAttribute";
import { WorldObject } from "../canvas/WorldObject";

const GameView: Component = () => {
  let input: HTMLInputElement;
  const [screenSize, setScreenSize] = createSignal<Vector2>({ x:0, y: 0 });
  const mobile = useMobile();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();

  useGameStateManager();

  onMount(() => {
    const updateDimensions = () => {
      setScreenSize({x: window.innerWidth, y: window.innerHeight});
    }

    const stepDelta = (value: number, newValue: number, step: number): number => {
      const delta = newValue - value;

      if (delta > 0)
        return value + Math.ceil(delta / step);
      if (delta < 0)
        return value + Math.floor(delta / step);
      return value;
    }

    let time = performance.now();
    const frame = () => {
      const deltaTime = performance.now() - time!;
      time = performance.now();
      requestAnimationFrame(frame);
      if (!gameState.myPlayer) return;
      // Typically in steps of 32, but gets smaller every frame
      const step = 40 / 100 * deltaTime;

      batch(() => {
        // Camera
        setGameState("cameraOffset", "x", (old) => stepDelta(old, -gameState.myPlayer!.position.x + screenSize().x / 2, step));
        setGameState("cameraOffset", "y", (old) => stepDelta(old, -gameState.myPlayer!.position.y + screenSize().y / 2, step));
        // Player
        setGameState("myPlayer", "position", "x", (old) => stepDelta(old, gameState.myPlayer!.targetPos!.x * tileSize, step));
        setGameState("myPlayer", "position", "y", (old) => stepDelta(old, gameState.myPlayer!.targetPos!.y * tileSize, step));
        // Remote players
        gameState.remotePlayers.forEach((player, idx) => {
          if (!player.targetPos) return;
          setGameState("remotePlayers", idx, "position", "x", (old) => stepDelta(old, player.targetPos!.x * tileSize, step));
          setGameState("remotePlayers", idx, "position", "y", (old) => stepDelta(old, player.targetPos!.y * tileSize, step));
        });
      });
    };

    // For now, assume the canvas has the same size as the window.
    updateDimensions()
    window.addEventListener('resize', updateDimensions);
    requestAnimationFrame(frame);
  });

  const objects = createMemo<Array<Player | Object>>(() => {
    if (!gameState.myPlayer) return [];

    // Sorted list of players/objects
    const objects = [
      gameState.myPlayer,
      ...gameState.remotePlayers,
      ...gameState.objects,
    ].sort((a, b) => {
      if (a.position.y > b.position.y) return -1;
      if (a.position.y < b.position.y) return 1;

      // Players always on top of objects (horizontally)
      if ("character" in a && !("character" in b)) return -1
      if (!("character" in a) && "character" in b) return 1
      if (!("character" in a) && !("character" in b)) return 0

      if (a.position.x > b.position.x) return 1;
      if (a.position.x < b.position.x) return -1;

      // Facing north means "on top" (for smooching, etc.)
      if (a.direction?.includes("N") && b.direction?.includes("S")) return -1;
      if (b.direction?.includes("N") && a.direction?.includes("S")) return 1;

      return 0;
    })

    return objects;
  });

  // TODO: maybe move to gameStateManager
  // Game navigation tile action
  createEffect(() => {
    // Don't trigger actions in edit mode
    const param = useCurrentTileAttribute();
    if (gameState.editMode || !param) return;

    switch (param.type) {
      case "portal":
        // Send/teleport player to (optional) room, (optional) coordinate
        if (param.room) console.log("Target room not yet implemented");
        if(param.coordinate) {
          batch(() => {
            setGameState("myPlayer", "targetPos", param.coordinate);
            setGameState("myPlayer", "position", { x: param.coordinate!.x * tileSize, y: param.coordinate!.y * tileSize });
          })
        }
        if(param.direction) setGameState("myPlayer", "direction", param.direction);
        break;
      case "impassable":
        // TODO: impassable: maybe bump user. Ignore for now
      case "spawn":
        // spawn: possible join spawn point: ignore
        // Ignore
        break;
      case "private":
        // TODO: private: isolated media streams from participants within the private room
      case "spotlight":
        // TODO: spotlight: large scale presentation to private room
        console.warn("Not yet implemented");
        break;
      default:
        console.warn("Unknown type:", param.type);
        break;
    }
  })

  createEffect(() => {
    if (gameState.chatMode) {
      input!.focus();
    }
  });

  const keyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case "Enter":
        if (input!.value)
          localParticipant().sendText(input!.value);
        // Fall through
      case "Escape":
        setGameState("chatMode", false);
        break;
    }
  }

  return (
    <Show when={connectionState() === ConnectionState.Connected} fallback={<>Not connected</>}>
      <Canvas>
        <Group
          transform={{
            position: gameState.cameraOffset
          }}
        >
          <AttributeTileGroup/>
          <Map image={"world/overlay.png"} overlay />
          <For each={objects()}>{(worldObject) => (
            <WorldObject entity={worldObject}/>
          )}</For>
          <EarshotRadius radius={gameState.earshotRadius} position={gameState.myPlayer?.position ?? {x:0, y: 0}} render />
          <Map image={"world/map.png"} />
        </Group>
      </Canvas>
      <Show when={mobile}>
        <NavigationButtons/>
      </Show>
      <SpatialAudioController/>
      <Show when={gameState.chatMode}>
        <div style={{
          position: "fixed",
          top: "15vh",
          left: "25vw",
          right: "25vw",
          "background-color": "rgba(255,255,255,0.6)",
          border: "2px solid black",
          "border-radius": "8px",
          padding: "8px",
          display: "flex",
        }}>
          <span>Chat:</span>
          <input
            ref={input!}
            name="chat"
            style={{
              "font-size": "16px",
              "font-family": "Pixeloid",
              "flex": "1 1 auto",
              "width": "100%",
            }}
            onKeyDown={keyDown}
          />
        </div>
      </Show>
      <Show when={gameState.debugMode}>
        <div style={{ position: "fixed", top: 0, left: 0 }}>
          player:{gameState.myPlayer?.position.x},{gameState.myPlayer?.position.y}<br/>
          player:{gameState.myPlayer?.targetPos?.x},{gameState.myPlayer?.targetPos?.y}<br/>
          offset:{gameState.cameraOffset.x},{gameState.cameraOffset.y}<br/>
          map:{gameState.mapSize.x},{gameState.mapSize.x}<br/>
          <div>
            <Button onClick={() => {
              setGameState("editMode", !gameState.editMode);
            }}>{gameState.editMode ? "regular mode" : "edit mode"}</Button>
          </div>
          <Button onClick={() => {
            const [spawn, direction] = getRandomSpawnPosition()
            batch(() => {
              setGameState("myPlayer", "targetPos", spawn);
              setGameState("myPlayer", "position", {x: spawn.x * tileSize, y: spawn.y * tileSize});
            })
            if (direction)
              setGameState("myPlayer", "direction", direction);            
          }}>spawn point</Button>
        </div>
        <Show when={gameState.editMode}>
          <TileInformation param={useCurrentTileAttribute()}/>
          <TileSelector/>
        </Show>
      </Show>
    </Show>
  );
};

export default GameView;
