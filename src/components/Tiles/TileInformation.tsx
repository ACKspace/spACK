import { Component, Match, Switch } from "solid-js";
import { TileParam } from "../../model/Tile";
import { directionToArrow } from "../../model/Direction";

type Props = {
  param?: TileParam;
}
export const TileInformation: Component<Props> = (props) => {
  return <div style={{position: "fixed", top: 0, right: 0}}>
    <Switch fallback={<>UNKNOWN: {props.param?.type}</>}>
      <Match when={props.param?.type === "impassable" && props.param}>
        {(t) => <>Impassable ({directionToArrow(t().direction) || "any"})</>}
      </Match>
      <Match when={props.param?.type === "portal" && props.param}>
        {(t) => <>
          <div>Portal</div>
          <div>Direction: {directionToArrow(t().direction) || "preserve"}</div>
          <div>Room: {t().room}</div>
          <div>Coordinate: {t().coordinate ? `${t().coordinate!.x}, ${t().coordinate!.y}` : "none"}</div>
        </>}
      </Match>
      <Match when={props.param?.type === "private" && props.param}>
        {(t) => <>Private: {t().identifier}</>}
      </Match>
      <Match when={props.param?.type === "spawn" && props.param}>
        {(t) => <>Spawn</>}
      </Match>
      <Match when={props.param?.type === "spotlight" && props.param}>
        {(t) => <>Spotlight: {t().identifier}</>}
      </Match>
      <Match when={!props.param}><></></Match>
    </Switch>
  </div>;
}
