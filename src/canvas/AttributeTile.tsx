import { Group, Rectangle, Text } from "../../solid-canvas/src";
import { Direction, directionToArrow } from "../model/Direction";
import { gameState } from "../model/GameState";
import { tileSize } from "../model/Tile";
import { Vector2 } from "../model/Vector2";
import { Component, Show } from "solid-js";

type Props = {
  /** The position of the attribute tile (helper) in tile units within the map */
  position: Vector2;
  /** The color of the tile; will fall back to grey. */
  color?: string;
  /** The outline color of the tile; defaults to transparent. */
  outline?: string;
  /** Optional arrow to draw */
  direction?: Direction;
  /** Whether to draw a circle instead of a rounded rect */
  round?: boolean
};

/**
 * Attribute tile for usage as overlay in edit mode
 */
export const AttributeTile: Component<Props> = (props) => {
  return <Group
    transform={{
      position: {
        x: tileSize * props.position.x,
        y: tileSize * props.position.y,
      }
    }}
  >
    <Show when={props.direction}>
      <Text
        transform={{
          position: {x: 12, y: 8}
        }}
        text={directionToArrow(props.direction)}
        outlineStyle="rgba(0,0,0,1)"
        style={{
          // TODO: align center
          fill: "white",
          fontSize: 24,
          fontFamily: "FsPixel",
          lineWidth: 6
        }}
      />
    </Show>
    <Rectangle
      style={{
        dimensions: { width: tileSize, height: tileSize},
        fill: props.color ?? "rgba(128,128,128,0.6)",
        stroke: props.outline ?? "transparent",
        rounded: props.round ? tileSize / 2 : 8,
        lineWidth: 3,
      }}
    />
  </Group>
};
