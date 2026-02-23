import { type WorldObject } from "../model/Object";
import { Player } from "../model/Player";
import { Component, Show } from "solid-js";
import { Character } from "./Character";
import { Object } from "./Object";

type Props = {
  /** The entity to draw */
  entity: Player | WorldObject;
};

export const WorldEntity: Component<Props> = (props) => {
  return <Show when={"character" in props.entity} fallback={<Object {...props}/>}>
    <Character
      username={props.entity.username}
      position={{ x: props.entity.position.x, y: props.entity.position.y }}
      speaking={props.entity.speaking}
      character={props.entity.character}
      animation={props.entity.animation}
      direction={props.entity.direction}/>
  </Show>
};
