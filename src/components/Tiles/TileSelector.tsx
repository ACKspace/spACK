import { Component, For, Match, Switch } from "solid-js";
import { gameState, setGameState } from "../../model/GameState";
import Button from "../Button/Button";
import { loadRoomMetadata, saveRoomMetadata } from "../../utils/useLiveKitRoom";
import { useRoomContext } from "../../solid-livekit";
import { Direction, directionToArrow as a } from "../../model/Direction";
import { Vector2 } from "../../model/Vector2";
import { CoordinateInput } from "../CoordinateInput";
import { WorldObject } from "../../model/Object";
import { TileParam } from "../../model/Tile";
import Input from "../Input/Input";
import { deleteRoom } from "../../utils/useToken";

type WorldParam = WorldObject | TileParam;
type ParamComponent<T extends WorldParam> = Component<{name: keyof T, label: string, options: Record<T[keyof T], string>}>;

/**
 * Tool param input
 * @param props 
 * @returns 
 */
const ToolInput: Component<{toolProps: WorldParam, name: string, label: string}> = (props) => {
  return <div>
    {props.label}:
    <Input value={props.toolProps[props.name as keyof WorldParam] ?? ""} onChange={(d) => setGameState("activeTool", props.name as keyof WorldParam, d.target.value ?? undefined)}/>
  </div>;
}


/**
 * Tool param select
 * @param props 
 * @returns 
 */
const Select: ParamComponent<WorldObject> = (props) => {
  return <div>
    {props.label}:
    <select
        value={gameState.activeTool[props.name] ?? ""}
        onChange={(d) => setGameState("activeTool", props.name as keyof WorldParam, d.target.value ?? undefined)}
        style={{ "font-family": "Pixeloid"}}
      >
        <For each={Object.entries(props.options)}>{([value, label]) =>
          <option value={value}>{label}</option>
        }</For>
      </select>
  </div>;
}


/**
 * Direction param select
 * @param props 
 * @returns 
 */
const DirectionSelect: Component<{label: string}> = (props) => {
  return <Select label={props.label} name="direction" options={{
      "": "none/preserve",
      "N": `${a("N")} North`,
      "NE": `${a("NE")} Northeast`,
      "E": `${a("E")} East`,
      "SE": `${a("SE")} Southeast`,
      "S": `${a("S")} South`,
      "SW": `${a("SW")} Southwest`,
      "W": `${a("W")} West`,
      "NW": `${a("NW")} Northwest`,
    }} />
}

const ImpassableTile: Component<{direction?: Direction}> = (props) => {
  return <>
    <div>Impassable:</div>
    <DirectionSelect label="Allow" />
    </>
};

const SpawnTile: Component<{direction?: Direction}> = (props) => {
  return <>
    <div>Spawn:</div>
    <DirectionSelect label="Facing" />
  </>
};

const PortalTile: Component<{direction?: Direction; coordinate?: Vector2; room?: string}> = (props) => {
  return <>
    <div>Portal:</div>
    <div>Room: <Input value={props.room ?? ""} onChange={(d) => setGameState("activeTool", "room", d.target.value ?? undefined)}/></div>
    <div>Coordinate: <CoordinateInput value={props.coordinate} onChange={(d) => setGameState("activeTool", "coordinate", d)}/></div>
    <DirectionSelect label="Facing" />
  </>
};

const PrivateTile: Component<{identifier: string}> = (props) => {
  return <>
    <div>Private:</div>
    <div>Identifier: <Input value={props.identifier ?? ""} onChange={(d) => setGameState("activeTool", "identifier", d.target.value ?? undefined)}/></div>
  </>
};

const SpotlightTile: Component<{identifier: string}> = (props) => {
  return <>
    <div>Spotlight:</div>
    <div>Identifier: <Input value={props.identifier ?? ""} onChange={(d) => setGameState("activeTool", "identifier", d.target.value ?? undefined)}/></div>
  </>
};

const ObjectEditor: Component<WorldObject> = (props) => {
  return <>
    <div>Object:</div>
    <ToolInput name="image" label="Image" toolProps={props} />
    <ToolInput name="activeImage" label="Active image" toolProps={props} />
    <Select label="Type" name="mediaType" toolProps={props} options={{"": "none", i: "Image", v: "Video", a: "Audio", p: "Embedded page", s: "Script" }} />
    <ToolInput name="uri" label="Uri" toolProps={props} />
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
        <Match when={gameState.activeTool?.type === "object" && gameState.activeTool}>
          {(t) => <ObjectEditor image={t().image} activeImage={t().activeImage} mediaType={t().mediaType} uri={t().uri} />}
        </Match>
      </Switch>
      <div style={{"padding-top": "16px"}}>
        <Button onClick={() => loadRoomMetadata(room())}>Load metadata</Button>
        <Button onClick={() => saveRoomMetadata(room())}>Save metadata</Button>
      </div>
      <div style={{"padding-top": "16px"}}>
        <Button onClick={() => {
          console.log(JSON.parse(room()?.metadata ?? ""));
        }}>Debugprint metadata</Button>
        <Button onClick={() => {
          console.log(JSON.parse(JSON.stringify(gameState)));
        }}>Debugprint gamestate</Button>
        <Button onClick={async () => {
          await room()?.localParticipant.setAttributes({ character: "doux" });
          setGameState("myPlayer", "character", room()?.localParticipant.attributes.character);
        }}>doux</Button>
        <Button onClick={async () => {
          await deleteRoom(room()!.name);
        }}>Delete room</Button>    
      </div>
    </div>
  );
}

export default TileSelector;
