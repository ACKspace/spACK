import { gameState, setGameState } from "../model/GameState";
import { ConnectionState } from "livekit-client";
import { batch, Component, createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { useConnectionState, useRoomContext } from "../solid-livekit";
import { getRandomSpawnPosition, useGameStateManager } from "../utils/useGameStateManager";
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
import Button from "./Button/Button";
import TileSelector from "./Tiles/TileSelector";
import { TileInformation } from "./Tiles/TileInformation";
import { useLocalParticipant } from "../utils/useLocalParticipant";

const GameView: Component = () => {
  let input: HTMLInputElement;
  // Player on-screen center, dependent on window resize and possibly world boundaries
  const [center, setCenter] = createSignal({x: 10, y: 10});
  // Screen size in tile units, aligned per 2 tiles to center player, determined on window resize
  const [screen, setScreen] = createSignal({x: 0, y: 0});

  const mobile = useMobile();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();

  useGameStateManager();

  onMount(() => {
    const updateDimensions = () => {
      batch(() =>{
        // Calculate amount of squares and its remainder

        // Step 2 blocks to center our character
        const w = Math.floor(window.innerWidth / tileSize / 2) * 2;
        const h = Math.floor(window.innerHeight / tileSize / 2) * 2;
        setScreen({
          x: w,
          y: h,
        });

        setGameState("cameraOffset", {
          x: (window.innerWidth % (tileSize * 2)) / 2,
          y: (window.innerHeight % (tileSize * 2) / 2),

        })

        // TODO: take world boundary into account (walking on the edge)
        setCenter({
          x: w / 2,
          y: h / 2,
        });
      });
    }

    // For now, assume the canvas has the same size as the window.
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
  })

  // Optional tile attribute where the user is standing on; used for triggering tile action and debug/edit info.
  const currentTileAttribute = createMemo(() => {
    if (!gameState.myPlayer) return undefined;
    const x = gameState.myPlayer.position.x;
    const y = gameState.myPlayer.position.y;
    return gameState.tileAttributes[`${x},${y}`];
  });

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
  });

  // TODO: maybe move to gamestateManager
  // Game navigation tile action
  createEffect(() => {
    // Don't trigger actions in edit mode
    const param = currentTileAttribute();
    if (gameState.editMode || !param) return;

    switch (param.type) {
      case "portal":
        // Send/teleport player to (optional) room, (optional) coordinate
        if (param.room) console.log("Target room not yet implemented");
        if(param.coordinate) setGameState("myPlayer", "position", param.coordinate);
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
        <Show when={gameState.editMode}>
          <Group
            transform={{
              position: {x: gameState.cameraOffset.x, y: gameState.cameraOffset.y}
            }}
          >
            <Show when={currentTileAttribute()?.type === "portal" && currentTileAttribute()}>{(t) =>
              <AttributeTile
                color={"rgba(0,0,128,0.6)"}
                outline={"rgba(255,255,255,0.6)"}
                round
                position={{
                  x: center().x + (t().coordinate?.x ?? -1000),
                  y: center().y + (t().coordinate?.y ?? -1000),
                }}
                direction={t().direction}
                />
            }</Show>
            <Show when={gameState.activeTool?.type === "portal" && gameState.activeTool}>{(t) =>
              <AttributeTile
                color={"rgba(128,0,0,0.6)"}
                outline={"rgba(255,255,255,0.6)"}
                round
                position={{
                  x: center().x + (t().coordinate?.x ?? -1000),
                  y: center().y + (t().coordinate?.y ?? -1000),
                }}
                direction={t().direction}
                />
            }</Show>
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
          screen:{screen().x},{screen().y}<br/>
          center:{center().x},{center().y}<br/>
          offset:{gameState.cameraOffset.x},{gameState.cameraOffset.y}<br/>
          map:{gameState.mapSize.x},{gameState.mapSize.x}<br/>
          <div>
            <Button onClick={() => {
              setGameState("editMode", !gameState.editMode);
            }}>{gameState.editMode ? "regular mode" : "edit mode"}</Button>
          </div>
          <Button onClick={() => {
            const [spawn, direction] = getRandomSpawnPosition()            
            setGameState("myPlayer", "position", spawn);
            if (direction)
              setGameState("myPlayer", "direction", direction);            
          }}>spawn point</Button>
        </div>
        <Show when={gameState.editMode}>
          <TileInformation param={currentTileAttribute()}/>
          <TileSelector/>
        </Show>
      </Show>
    </Show>
  );
};

export default GameView;
