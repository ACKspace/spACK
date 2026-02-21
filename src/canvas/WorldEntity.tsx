import { Image } from "../../solid-canvas/src";
import { type WorldObject } from "../model/Object";
import { Player } from "../model/Player";
import { Component, Show } from "solid-js";
import { Character } from "./Character";
import { gameState } from "../model/GameState";

type Props = {
  /** The center of the earshot radius in tile units within the map */
  entity: Player | WorldObject;
};

export const WorldEntity: Component<Props> = (props) => {
  return <Show when={"character" in props.entity} fallback={
    <Image
      transform={{
          position: {x: props.entity.position.x, y: props.entity.position.y - 32}
      }}
      style={{
        sourceOffset: { x:0, y: 0 },
        // sourceDimensions: { width: 200, height: 100 },
        dimensions: { width: 64, height: 64 },
        smoothingQuality: "none",
      }}
      image={`world/${gameState.base}${props.entity.active ? props.entity.activeImage : props.entity.image}`}
    />
  }>
    <Character
      username={props.entity.username}
      position={{ x: props.entity.position.x, y: props.entity.position.y }}
      character={props.entity.character}
      animation={props.entity.animation}
      direction={props.entity.direction}/>
  </Show>

};
