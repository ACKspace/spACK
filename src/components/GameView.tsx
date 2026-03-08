import { clearGameState, gameState, setGameState } from "../model/GameState";
import { ConnectionState } from "livekit-client";
import { batch, Component, createEffect, createMemo, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
import { useConnectionState, useRoomContext } from "../solid-livekit";
import { getRandomSpawnPosition, useGameStateManager } from "../utils/useGameStateManager";
import { Canvas, Group } from "../../solid-canvas/src";
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
import { type WorldObject } from "../model/Object";
import { useCurrentTileAttribute } from "../utils/useCurrentTileAttribute";
import { WorldEntity } from "../canvas/WorldEntity";
import { TextBubble } from "../canvas/TextBubble";
import Input from "./Input/Input";
import { setAttributes, useToken } from "../utils/token";
import toast from "solid-toast";
import { PrivateArea } from "../canvas/PrivateArea";
import { MicrophoneMuteButton } from "./MicrophoneMuteButton";
import { MicrophoneSelector } from "./MicrophoneSelector";

const GameView: Component = () => {
  let input: HTMLInputElement;
  const [screenSize, setScreenSize] = createSignal<Vector2>({ x:0, y: 0 });
  const mobile = useMobile();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const showOverlay = createMemo(() => {
    if ( gameState.currentObject?.active && ["a", "i", "v", "p"].includes(gameState.currentObject.mediaType!)) return true;
    return false;
  });

  const room = useRoomContext();

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
        setGameState("cameraOffset", "x", (old) => stepDelta(old, -gameState.myPlayer!.position.x + Math.round(screenSize().x / 2), step));
        setGameState("cameraOffset", "y", (old) => stepDelta(old, -gameState.myPlayer!.position.y + Math.round(screenSize().y / 2), step));
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

  const objects = createMemo<Array<Player | WorldObject>>(() => {
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
    if (!gameState.myPlayer || gameState.mode === "edit") return;

    // Handle private tiles
    setGameState("myPlayer", "private", param?.type === "private" ? param.identifier : undefined);
    if (!param) return;

    switch (param.type) {
      case "portal":
        batch(() => {
          // Send/teleport player to (optional) room, (optional) coordinate
          if (param.room) {
            room()?.disconnect();
            // room()?.connect("", "")
            clearGameState();

            setAttributes("roomName", param.room);
            // TODO: handle password (when token fails)
          }

          if(param.coordinate) {
            batch(() => {
              setGameState("myPlayer", "targetPos", param.coordinate);
              setGameState("myPlayer", "position", { x: param.coordinate!.x * tileSize, y: param.coordinate!.y * tileSize });
            })
          }
          if(param.direction) setGameState("myPlayer", "direction", param.direction);
        });

        break;
      case "impassable":
        // TODO: impassable: maybe bump user. Ignore for now
      case "spawn":
        // spawn: possible join spawn point: ignore
        // Ignore
        break;
      case "private":
        // private: isolated media streams from participants within the private room
        // Already handled at the top
        break;
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
    if (gameState.mode === "chat") {
      input!.focus();
    }
  });

  const keyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case "Enter":
        if (input!.value)
          localParticipant().sendText(input!.value);
        input!.value = "";
        break;

      case "Escape":
        // Close dialog
        setGameState("mode", undefined);
        break;
    }
  }

  return (<>
    <Show when={connectionState() === ConnectionState.Connected} fallback={<>Not connected</>}>
      <Canvas>
        <Group
          transform={{
            position: gameState.cameraOffset
          }}
        >
          <Show when={gameState.currentObject}>{(co) =>
            <TextBubble position={co().position} text="Press 'x' to activate" />
          }</Show>
          <AttributeTileGroup/>
          <Map image={`world/${gameState.base}/overlay.png`} overlay />
          <For each={objects()}>{(worldEntity) => (
            <WorldEntity entity={worldEntity}/>
          )}</For>
          <Show
            when={gameState?.myPlayer?.private}
            keyed
            fallback={<EarshotRadius radius={gameState.earshotRadius} position={gameState.myPlayer?.position ?? {x:0, y: 0}} render />}
          >{(privateName) => <>
            <PrivateArea private={privateName} render />
          </>}
          </Show>
          <Map image={`world/${gameState.base}/map.png`} />
        </Group>
      </Canvas>
      <SpatialAudioController/>

      {/* Chat popup */}
      <Show when={showOverlay()}>
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
          <Switch>
            <Match when={gameState.currentObject?.mediaType === "a"}>
              <audio
                autoplay
                controls
                style={{"max-width":"100%"}}
                src={gameState.currentObject?.uri}
                />
            </Match>
            <Match when={gameState.currentObject?.mediaType === "i"}>
              <img
                style={{"max-width":"100%", "max-height":"100%"}}
                src={gameState.currentObject?.uri}
                />
            </Match>
            <Match when={gameState.currentObject?.mediaType === "p"}>
              <iframe
                allowfullscreen
                style={{"max-width":"100%", "aspect-ratio":"16/9"}}
                src={gameState.currentObject?.uri}
                />
            </Match>
            <Match when={gameState.currentObject?.mediaType === "v"}>
              <video
                autoplay
                controls
                style={{"max-width":"100%", "aspect-ratio":"16/9"}}
                src={gameState.currentObject?.uri}
                />
            </Match>
          </Switch>
        </div>
      </Show>

      {/* TODO: Make sure everything still fits on the screen */}
      <Show when={mobile}>
        <NavigationButtons right={gameState.mode ? "30em": "0"} />
      </Show>
    </Show>
    <div
      style={{
        "box-sizing": "border-box",
        position: "fixed",
        top: 0,
        bottom: 0,
        right: 0,
        width: gameState.mode ? "30em": 0,
        "background-color": "rgba(255,255,255,0.6)",
        padding: gameState.mode ? "8px" : 0
      }}
    >
      <div>
      <Button title="Participants" onClick={() => setGameState("mode", "participants")}>👥</Button>
      <Button title="Chat" onClick={() => setGameState("mode", "chat")}>💬</Button>
      <Button title="Settings" onClick={() => setGameState("mode", "settings")}>⚙️</Button>
      <Button title="Edit" onClick={() => setGameState("mode", "edit")}>📝</Button>
      <Show when={gameState.debugMode}>
        <Button title="Debug" onClick={() => setGameState("mode", "debug")}>🪳</Button>
      </Show>      
      <Button title="Close" onClick={() => setGameState("mode", undefined)}>✖</Button>
      </div>
      <Switch>
        <Match when={gameState.mode === "participants"}>
          <div>participants</div>
        </Match>
        <Match when={gameState.mode === "chat"}>
          <div>
            <span>Chat:</span>
            <Input
              ref={input!}
              name="chat"
              autocomplete="off"
              onKeyDown={keyDown}
            />
          </div>
        </Match>
        <Match when={gameState.mode === "settings"}>
          <div>
          <MicrophoneMuteButton />
          <MicrophoneSelector />            
          </div>
        </Match>
        <Match when={gameState.mode === "edit"}>
          <div>
            <TileInformation param={useCurrentTileAttribute()}/>
            <TileSelector/>
          </div>
        </Match>
        <Match when={gameState.mode === "debug"}>
          ROOM: {useToken().room} {gameState.base}<br/>
          {/* offset:{gameState.cameraOffset.x},{gameState.cameraOffset.y}<br/>
          map:{gameState.mapSize.x},{gameState.mapSize.x}<br/>
          current object: {gameState.currentObject?.image} {gameState.currentObject?.active ? "ACTIVE" : "none"}<br/> */}
          <Button onClick={async () => {
            try {
              await navigator.clipboard.writeText(import.meta.env.VITE_VERSION);
              toast.success("Version copied to clipboard");
            } catch {
              toast.error("Clipboard error");
            }
          }}>{import.meta.env.VITE_VERSION} 📋</Button><br/>
          <Button onClick={() => {
            const [spawn, direction] = getRandomSpawnPosition()
            batch(() => {
              setGameState("myPlayer", "targetPos", spawn);
              setGameState("myPlayer", "position", {x: spawn.x * tileSize, y: spawn.y * tileSize});
            })
            if (direction)
              setGameState("myPlayer", "direction", direction);            
          }}>spawn point</Button>
        </Match>
      </Switch>
    </div>
    <Show when={!gameState.mode}>
      <Button
        style={{ position: "fixed", top: 0, right: 0, padding: "8px 16px"}}
        onClick={() => setGameState("mode", "participants")}
      >☰</Button>
    </Show>
  </>);
};

export default GameView;
