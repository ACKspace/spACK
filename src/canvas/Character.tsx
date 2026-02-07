import { Arc, Group, Image, Text } from "../../solid-canvas/src";
import { CharacterName } from "../components/CharacterSelector/CharacterSelector";
import { AnimationState } from "../model/AnimationState";
import { Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { Direction } from "../model/Direction";
import { ImageSource } from "../../solid-canvas/src/types";
import { directionToLeftRight } from "../utils/legacyDirection";
import { tileSize } from "../model/Tile";

type Props = {
  x: number;
  y: number;
  speaking?: boolean;
  username: string;
  animation: AnimationState;
  character: CharacterName;
  direction: Direction;
};

const CHAR_SIZE = 72;
const CHAR_OFFSET = (CHAR_SIZE - tileSize) / 2;

type SpriteInfo = {
  image: ImageSource;
  rows: number;
  cols: number;
  width: number;
  height: number;
  animations: Record<AnimationState, number[]>;
}

// TODO: images from cache?
const sprite: SpriteInfo = {
  image: "",
  rows: 2,
  cols: 24,
  width: 24,
  height: 24,
  animations: {
    "idle": [0,1,2,3],
    "walk": [4,5,6,7,8,9],
  }
}

export const Character: Component<Props> = (props) => {
  const [frame, setFrame] = createSignal(0);
  const offset = createMemo(() => {
    // TODO: props.animation sanity check
    const animation = sprite.animations[props.animation];
    if (!animation) return {x: 0, y: 0}; // Return top left of sprite
    // Second row is left orientation
    const offset = directionToLeftRight(props.direction) === "left" ? sprite.cols : 0;
    const currentFrame = animation[frame() % animation.length] + offset;

    return {
      x: (currentFrame % sprite.cols) * sprite.width,
      y: Math.floor(currentFrame / sprite.cols) * sprite.width,
    };
  });

  onMount(() => {
    // TODO: proper animation and timer
    const timer = setInterval(() => {
      setFrame((old) => old + 1);
    }, 100);

    onCleanup(() => {
      clearInterval(timer);
    })
  })

  // Debug dot
  // return <Arc
  //   transform={{
  //     // Note: this is centered, but currently on the edge of a tile (using 100x100 map)      
  //     position: {x: props.x * tileSize, y: props.y * tileSize}
  //   }}
  //   style={{
  //     radius: (tileSize/2),
  //     fill: "rgba(255, 0, 255, 0.59)",
  //     stroke: "transparent",
  //   }}
  // />;

  return <Group
    transform={{
      position: {
        x: props.x * tileSize - CHAR_OFFSET,
        y: (props.y - 1) * tileSize - CHAR_OFFSET / 2,
      }
    }}
  >
    <Text
      transform={{
        position: {x: 0, y: -10}
      }}
      text={props.username}
      outlineStyle="rgba(0,0,0,1)"
      style={{
        // TODO: align center
        fill: "white",
        fontSize: 24,
        fontFamily: "FsPixel",
        lineWidth: 6
      }}
    />
    <Image
      style={{
        sourceOffset: { x: offset().x, y: offset().y },
        sourceDimensions: { width: sprite.width, height: sprite.height },
        dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
        smoothingQuality: "none",
      }}
      image={`characters/${props.character}.png`}
    />
  </Group>;
};

