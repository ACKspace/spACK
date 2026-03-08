import { Component, For, Show } from "solid-js";
import { AttributeTile } from "./AttributeTile";
import { gameState } from "../model/GameState";

type Props = {
  /** The name of the private tiles to highlight */
  private: string;
  /** Whether to render the area */
  render?: boolean;
};

export const PrivateArea: Component<Props> = (props) => {
  return <Show when={props.render}>
    <For each={Object.keys(gameState.tileAttributes)}>{(key) => {
      const [x,y] = key.split(",").map(axis => parseInt(axis));
      const tile = gameState.tileAttributes[key];
      if ( tile.type!== "private" || tile.identifier !== props.private) return undefined;
      return <AttributeTile
        square
        color="rgba(255,255,255,0.2)"
        position={{
          x,
          y,
        }}
        />
    }}</For>
  </Show>
};
