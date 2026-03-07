import { Arc, Group, Image, Text } from "../../solid-canvas/src";
import { Component, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { tileSize } from "../model/Tile";
import { PlayerProps, SpriteInfo } from "../model/Player";
import { directionToIndex } from "../utils/direction";

/** Character body (mandatory) */
export const Body = {
  PaleFemale: "1",
  RegularFemale: "2",
  DarkFemale: "3",
  PaleMale: "4",
  RegularMale: "0",
  DarkMale: "5",
} as const;

/** Future feature */
export const HeadGear = {
  None: " ",
} as const;

export const Hair = {
  None: " ",
  Brown: "0",
  White: "1",
  LongRed: "2",
  BlondeShort: "3",
  Blonde: "4",
  BlondeMedium: "5",
  BlackLong: "6",
  Black: "7",
} as const;

/** Future feature */
export const FacialHair = {
  None: " ",
} as const;

/** Future feature */
export const Attribute = {
  None: " ",
} as const;

export const Jacket = {
  None: " ",
  Purple: "0",
  Ochre: "1",
} as const;

export const Top = {
  None: " ",
  Dress: "0",
  White: "1",
  Red: "2",
} as const;

/** Somewhat tied to top */
export const Bottom = {
  None: " ",
  Blue: "0",
  Brown: "1",
} as const;

/** Somewhat tied to top */
export const Shoes = {
  None: " ",
  Brown: "0",
} as const;

type ValueOf<T> = T[keyof T];

export type CharacterName = `${
  ValueOf<typeof Body>
}${
  ValueOf<typeof HeadGear>
}${
  ValueOf<typeof Hair>
}${
  ValueOf<typeof FacialHair>
}${
  ValueOf<typeof Attribute>
}${
  ValueOf<typeof Jacket>
}${
  ValueOf<typeof Top>
}${
  ValueOf<typeof Bottom>
}${
  ValueOf<typeof Shoes>
}`;

const CHAR_SIZE = 64;
const CHAR_OFFSET = (CHAR_SIZE - tileSize) / 2;

// TODO: images from cache?
const sprite: SpriteInfo = {
  image: "",
  rows: 6,
  cols: 24,
  width: 32,
  height: 32,
  animations: {
    "idle": [0],
    "walk": [0,1,2,3,4,5],
  }
}

export const Character: Component<PlayerProps<CharacterName>> = (props) => {
  const [frame, setFrame] = createSignal(0);
  const animationFrame = createMemo(() => {
    // Animation sanity check
    const animation = sprite.animations[props.animation];
    if (!animation) 0; // Return top left of sprite
    const offset = directionToIndex(props.direction) * 6;
    const currentFrame = animation[frame() % animation.length] + offset;
    return currentFrame * sprite.width;
  });
  const bodyOffset = createMemo(() => parseInt(props.character[0]) * sprite.width);
  // TODO: headGearOffset
  const hairOffset = createMemo(() => {
    if (props.character[2] === " ") return undefined;
    return parseInt(props.character[2]) * sprite.width;
  });
  // TODO: facialHairOffset
  // TODO: attributeOffset
  const jacketOffset = createMemo(() => {
    if (props.character[5] === " ") return undefined;
    return parseInt(props.character[5]) * sprite.width;
  });
  const topOffset = createMemo(() => {
    if (props.character[6] === " ") return undefined;
    return parseInt(props.character[6]) * sprite.width;
  });
  // TODO: bottomOffset
  // TODO: shoesOffset

  onMount(() => {
    // TODO: proper animation and timer
    const timer = setInterval(() => {
      setFrame((old) => old + 1);
    }, 100);

    onCleanup(() => {
      clearInterval(timer);
    })
  })

  return <Group
    transform={{
      position: {x: props.position.x - CHAR_OFFSET, y: props.position.y - CHAR_OFFSET - CHAR_OFFSET}
    }}
  >
    <Text
      transform={{
        position: {x: 0, y: -20}
      }}
      text={props.username}
      outlineStyle="rgba(0,0,0,1)"
      style={{
        // TODO: align center
        fill: `${props.speaking ? "pink" : "white"}`,
        fontSize: 24,
        fontFamily: "FsPixel",
        lineWidth: 6
      }}
    />

    {/* HeadGear: TODO */}

    {/* Hair */}
    <Show when={hairOffset() !== undefined}>
      <Image
        style={{
          sourceOffset: { x: animationFrame(), y: hairOffset()! },
          sourceDimensions: { width: sprite.width, height: sprite.height },
          dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
          smoothingQuality: "none",
        }}
        image={`characters/${"Hair"}.png`}
      />
    </Show>

    {/* FacialHair: TODO */}

    {/* Attribute: TODO */}

    {/* Jacket */}
    <Show when={jacketOffset() !== undefined}>
      <Image
        style={{
          sourceOffset: { x: animationFrame(), y: jacketOffset()! },
          sourceDimensions: { width: sprite.width, height: sprite.height },
          dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
          smoothingQuality: "none",
        }}
        image={`characters/${"Jacket"}.png`}
      />
    </Show>

    {/* Top */}
    <Show when={topOffset() !== undefined}>
      <Image
        style={{
          sourceOffset: { x: animationFrame(), y: topOffset()! },
          sourceDimensions: { width: sprite.width, height: sprite.height },
          dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
          smoothingQuality: "none",
        }}
        image={`characters/${"Top"}.png`}
      />
    </Show>

    {/* Bottom */}

    {/* Shoes */}

    {/* Body */}
    <Image
      style={{
        sourceOffset: { x: animationFrame(), y: bodyOffset() },
        sourceDimensions: { width: sprite.width, height: sprite.height },
        dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
        smoothingQuality: "none",
      }}
      image={`characters/${"Body"}.png`}
    />

    {/* Shadow */}
    <Image
      style={{
        // sourceOffset: { x: 0, y: 0},
        sourceDimensions: { width: sprite.width, height: sprite.height },
        dimensions: { width: CHAR_SIZE, height: CHAR_SIZE },
        smoothingQuality: "none",
      }}
      image={`characters/${"Shadow"}.png`}
    />
  </Group>;
};

