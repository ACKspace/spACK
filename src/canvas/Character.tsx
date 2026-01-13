import { Image, Rectangle } from "../../solid-canvas/src";
import { CharacterName } from "../components/CharacterSelector";
import { AnimationState } from "../model/AnimationState";
import { Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { Direction } from "../model/Direction";
import { ImageSource } from "../../solid-canvas/src/types";

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

// tile w/h, rows, cols, scale: 3

// TODO: mirrored image?
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
  rows: 1,
  cols: 24,
  width: 24,
  height: 24,
  animations: {
    "idle": [0,1,2,3],
    "walk": [4,5,6,7,8,9],
  }
}

export const Character: Component<Props> = (props) => {
  // console.log(props.username, props.x, props.y);
  const [frame, setFrame] = createSignal(0);
  const offset = createMemo(() => {
    // TODO: props.animation sanity check
    const animation = sprite.animations[props.animation];
    const currentFrame = animation[frame() % animation.length];

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

  return <Image
    transform={{
      position: {x: props.x * 32 - CHAR_SIZE / 2, y: props.y * 32 - CHAR_SIZE / 2}
      
    }}
    style={{
      sourceOffset: { x: offset().x, y: offset().y },
      sourceDimensions: { width: sprite.width, height: sprite.height },
      dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
    }}
    image={`/characters/${props.character}.png`}
  />;

  return <Rectangle
    transform={{
      position: {x: props.x * 32 - 16, y: props.y * 32 - 16}
    }}
    style={{
      dimensions: { width: 32, height: 32 },
      fill: "magenta"
    }}
  />
  
  // const { color: usernameOutlineColor, thickness: usernameOutlineThickness } =
  const outline = createMemo(() => {
      if (props.speaking) {
        return { color: 0x00ff00, thickness: 6 };
      } else {
        return { color: 0x000000, thickness: 4 };
      }
    });

  const animationName = createMemo(() => (props.animation.startsWith("idle_") ? "idle" : "walk"));
  const scale = createMemo(() => (props.animation.endsWith("_right") ? 1 : -1));

  return (
    <>
    "{props.username}"
    {props.animation}
    {props.x}, {props.y}
    {animationName()}
    {scale()}
    {/* {outline()} */}
    {/* <P.Container position={{x: props.x, y: props.y}} zIndex={props.y} sortableChildren={true}>
      <P.Text
        anchor={{x: 0.5, y: 1}}
        x={0}
        y={-60}
        text={props.username}
        style={
          new TextStyle({
            fill: "0xffffff",
            stroke: { color: outline().color, width: outline().thickness },
          })
        }
      />
      <Show when={animationSheet()?.[animationName()]} keyed>{(t) =>
        <>{t}
        <P.AnimatedSprite
          // key={a}
          scale={{x: scale(), y: 1}}
          anchor={{x: 0.5, y: 0.65}}
          // isPlaying={true}
          animationSpeed={0.15}
          textures={t}
        /></>}
      </Show>
    </P.Container> */}
    </>
  );
};

