import { type WorldObject } from "../model/Object";
import { Player } from "../model/Player";
import { Component, Match, Switch } from "solid-js";
import { Dino } from "./Dino";
import { Object } from "./Object";
import { Character } from "./Character";

type Props = {
  /** The entity to draw */
  entity: Player | WorldObject;
};

export const WorldEntity: Component<Props> = (props) => {
  return <Switch fallback={<Object {...props}/>}>
    <Match when={[ "doux", "mort", "targ", "vita" ].includes(props.entity.character)}>
      <Dino
        username={props.entity.username}
        position={{ x: props.entity.position.x, y: props.entity.position.y }}
        speaking={props.entity.speaking}
        character={props.entity.character}
        animation={props.entity.animation}
        direction={props.entity.direction}
      />
    </Match>
    <Match when={"character" in props.entity}>
      <Character
        username={props.entity.username}
        position={{ x: props.entity.position.x, y: props.entity.position.y }}
        speaking={props.entity.speaking}
        character={props.entity.character}
        animation={props.entity.animation}
        direction={props.entity.direction}
      />
    </Match>
  </Switch>
};
