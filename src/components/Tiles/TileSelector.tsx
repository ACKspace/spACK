import { Component, Match, Switch } from "solid-js";
import { gameState, setGameState } from "../../model/GameState";
import Button from "../Button/Button";
import { loadRoomMetadata, saveRoomMetadata } from "../../utils/useLiveKitRoom";
import { useRoomContext } from "../../solid-livekit";
import { Direction, directionToArrow as a } from "../../model/Direction";
import { Vector2 } from "../../model/Vector2";
import { CoordinateInput } from "../CoordinateInput";

const DirectionSelect: Component<{value?: Direction; onChange: (value: Direction) => void}> = (props) => {
  return <select
    value={props.value ?? ""}
    onchange={(e) => props.onChange((e.target.value ?? undefined) as Direction)}
    style={{ "font-family": "Pixeloid"}}
  >
    <option value="">none/preserve</option>
    <option value="N">{a("N")} North</option>
    <option value="NE">{a("NE")} Northeast</option>
    <option value="E">{a("E")} East</option>
    <option value="SE">{a("SE")} Southeast</option>
    <option value="S">{a("S")} South</option>
    <option value="SW">{a("SW")} Southwest</option>
    <option value="W">{a("W")} West</option>
    <option value="NW">{a("NW")} Northwest</option>
  </select>
}

const ImpassableTile: Component<{direction?: Direction}> = (props) => {
  return <>
    <div>Impassable:</div>
    <div>Allow: <DirectionSelect value={props.direction} onChange={(d) => setGameState("activeTool", "direction", d)}/></div>
    </>
};

const SpawnTile: Component<{direction?: Direction}> = (props) => {
  return <>
    <div>Spawn:</div>
    <div>Facing: <DirectionSelect value={props.direction} onChange={(d) => setGameState("activeTool", "direction", d)}/></div>
  </>
};

const PortalTile: Component<{direction?: Direction; coordinate?: Vector2; room?: string}> = (props) => {
  return <>
    <div>Portal:</div>
    <div>Room: <input value={props.room ?? ""} onChange={(d) => setGameState("activeTool", "room", d.target.value ?? undefined)}/></div>
    <div>Coordinate: <CoordinateInput value={props.coordinate} onChange={(d) => setGameState("activeTool", "coordinate", d)}/></div>
    <div>Facing: <DirectionSelect value={props.direction} onChange={(d) => setGameState("activeTool", "direction", d)}/></div>
  </>
};

const PrivateTile: Component<{identifier: string}> = (props) => {
  return <>
    <div>Private:</div>
    <div>Identifier: <input value={props.identifier ?? ""} onChange={(d) => setGameState("activeTool", "identifier", d.target.value ?? undefined)}/></div>
  </>
};

const SpotlightTile: Component<{identifier: string}> = (props) => {
  return <>
    <div>Spotlight:</div>
    <div>Identifier: <input value={props.identifier ?? ""} onChange={(d) => setGameState("activeTool", "identifier", d.target.value ?? undefined)}/></div>
  </>
};

const TileSelector: Component = () => {
  const room = useRoomContext();
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, background: "rgba(255,255,255,0.5)", padding: "8px" }}>
      <Switch fallback={<>Erase</>}>
        <Match when={gameState.activeTool?.type === "impassable" && gameState.activeTool}>
          {(t) => <ImpassableTile direction={t().direction}/>}
        </Match>
        <Match when={gameState.activeTool?.type === "portal" && gameState.activeTool}>
          {(t) => <PortalTile direction={t().direction} coordinate={t().coordinate} room={t().room}/>}
        </Match>
        <Match when={gameState.activeTool?.type === "private" && gameState.activeTool}>
          {(t) => <PrivateTile identifier={t().identifier}/>}
        </Match>
        <Match when={gameState.activeTool?.type === "spawn" && gameState.activeTool}>
          {(t) => <SpawnTile direction={t().direction}/>}
        </Match>
        <Match when={gameState.activeTool?.type === "spotlight" && gameState.activeTool}>
          {(t) => <SpotlightTile identifier={t().identifier}/>}
        </Match>
      </Switch>
      <div style={{"padding-top": "16px"}}>
        <Button onClick={() => loadRoomMetadata(room())}>Load metadata</Button>
        <Button onClick={() => saveRoomMetadata(room())}>Save metadata</Button>
      </div>
    </div>
  );
}

export default TileSelector;
