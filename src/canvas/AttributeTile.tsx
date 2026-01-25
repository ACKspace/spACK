import { Rectangle } from "../../solid-canvas/src";
import { gameState } from "../model/GameState";
import { tileSize } from "../model/Tile";
import { Vector2 } from "../model/Vector2";
import { Component } from "solid-js";

type Props = {
  /** The position of the attribute tile (helper) in tile units within the map */
  position: Vector2;
  /** The color of the tile; will fall back to grey. */
  color?: string;
};

/**
 * Attribute tile for usage as overlay in edit mode
 */
export const AttributeTile: Component<Props> = (props) => {
  return <Rectangle
    transform={{
      // TODO: relative to own player/map
      position: {
        x: tileSize * (props.position.x - (gameState.myPlayer?.position.x ?? 0)),
        y: tileSize * (props.position.y - (gameState.myPlayer?.position.y ?? 0)),
      }
    }}
    style={{
      dimensions: { width: tileSize, height: tileSize},
      fill: props.color ?? "rgba(128,128,128,0.6)",
      stroke: "transparent",
      rounded: 8,
    }}
  />
};
