import { Image } from "../../solid-canvas/src";
import { type WorldObject } from "../model/Object";
import { Component, createSignal } from "solid-js";
import { gameState } from "../model/GameState";

type Props = {
  entity: WorldObject;
};

export const Object: Component<Props> = (props) => {
  const [size, setSize] = createSignal({width: 0, height: 0});

  return <Image
    onLoad={setSize}
    transform={{
        position: {x: props.entity.position.x, y: props.entity.position.y - size().height}
    }}
    style={{
      sourceOffset: { x:0, y: 0 },
      dimensions: { width: size().width * 2, height: size().height * 2 },
      smoothingQuality: "none",
    }}
    image={`world/${gameState.base}${props.entity.active ? props.entity.activeImage : props.entity.image}`}
  />;
};
