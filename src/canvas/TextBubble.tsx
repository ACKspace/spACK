import { Group, Rectangle, Text } from "../../solid-canvas/src";
import { Component } from "solid-js";
import { Vector2 } from "../model/Vector2";
import { tileSize } from "../model/Tile";

type Props = {
  /** Offset within the map in pixels */
  position: Vector2;

  /** The text to display */
  text: string;

  /** Background color */
  color?: string;
};

export const TextBubble: Component<Props> = (props) => {
  // Debug dot
  return <Group
    transform={{
      position: {x: props.position.x + tileSize, y: props.position.y - 64}
    }}
  >
    <Text
      transform={{
        position: {x: 8, y: 8}
      }}
      text={props.text}
      outlineStyle="rgba(0,0,0,1)"
      style={{
        align: "center",
        fill: "white",
        fontSize: 24,
        fontFamily: "FsPixel",
        lineWidth: 6
      }}
      // controllers={[(...arg) => {console.log(arg)}]}
    />
    <Rectangle
      transform={{
        // TODO: derive from text width
        position: {x: -104, y: 0}
      }}
      style={{
        dimensions: { width: 220, height: 32},
        fill: props.color ?? "rgba(128,128,128,0.6)",
        stroke: "transparent",
        rounded: 8,
        lineWidth: 3,
      }}
    />
  </Group>;
};

