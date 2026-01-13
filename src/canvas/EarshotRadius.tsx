import { Vector2 } from "../model/Vector2";
import { Component } from "solid-js";

type Props = {
  earshotRadius: number;
  myPlayerPosition: Vector2;
  backgroundZIndex: number;
  render: boolean;
};

export const EarshotRadius: Component<Props> = (props) => {
  // TODO: RADIUS white 10% {props.earshotRadius}
  return null;
};
