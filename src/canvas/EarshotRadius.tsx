import { Arc } from "../../solid-canvas/src";
import { tileSize } from "../model/Tile";
import { Vector2 } from "../model/Vector2";
import { Component, Show } from "solid-js";

type Props = {
  /** The radius in tile units */
  radius: number;
  /** The center of the earshot radius in tile units within the map */
  position: Vector2;
  /** Whether to render the radius */
  render?: boolean;
};

export const EarshotRadius: Component<Props> = (props) => {
  return <Show when={props.render}>
    <Arc
      transform={{
        position: {
          x: props.position.x - (tileSize * props.radius),
          y: props.position.y - (tileSize * props.radius),
        }
      }}
      style={{
        radius: tileSize * (props.radius + 0.5),
        fill: "rgba(255,255,255,0.1)",
        stroke: "transparent",
      }}
    />
  </Show>
};
