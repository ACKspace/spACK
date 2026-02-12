import { Component, createMemo, For, Show } from "solid-js";
import { gameState } from "../model/GameState";
import { AttributeTile } from "./AttributeTile";
import { tileColors } from "../model/Tile";
import { useCurrentTileAttribute } from "../utils/useCurrentTileAttribute";

export const AttributeTileGroup: Component = (props) => {

  return <Show when={gameState.editMode}>
    <>
      {/* Portal target, if on top of portal */}
      <Show when={useCurrentTileAttribute()?.type === "portal" && useCurrentTileAttribute()}>{(t) =>
        <AttributeTile
          color={"rgba(0,0,128,0.6)"}
          outline={"rgba(255,255,255,0.6)"}
          round
          position={{
            x: t().coordinate?.x ?? -1000,
            y: t().coordinate?.y ?? -1000,
          }}
          direction={t().direction}
          />
      }</Show>
      {/* Portal target, if selected */}
      <Show when={gameState.activeTool?.type === "portal" && gameState.activeTool}>{(t) =>
        <AttributeTile
          color={"rgba(128,0,0,0.6)"}
          outline={"rgba(255,255,255,0.6)"}
          round
          position={{
            x: t().coordinate?.x ?? -1000,
            y: t().coordinate?.y ?? -1000,
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
            x,
            y,
          }}
          direction={tile.direction}
          />
      }}</For>
    </>
  </Show>;
}
