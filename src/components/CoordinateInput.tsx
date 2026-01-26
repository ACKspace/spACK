import { Component, createEffect, createSignal } from "solid-js";
import { Vector2 } from "../model/Vector2";

export const CoordinateInput: Component<{coordinate?: Vector2; onChange?: (coordinate?: Vector2) => void}> = (props) => {
  const [x, setX] = createSignal<number | undefined>(props.coordinate?.x);
  const [y, setY] = createSignal<number | undefined>(props.coordinate?.x);
  const [coordinate, setCoordinate] = createSignal<Vector2>();

  // Only set complete, correct coordinates 
  createEffect(() => {
    if (x() !== undefined || y() !== undefined) {
      setCoordinate({x: x()!, y: y()!});      
    } else {
      setCoordinate();
    }
  })

  createEffect(() => {
    props.onChange?.(coordinate());
  })

  return <>
    <input type="number" value={x() ?? ""} onChange={(d) => setX(d.target.value ? parseInt(d.target.value) : undefined)} placeholder="X"/>
    ,
    <input type="number" value={y() ?? ""} onChange={(d) => setY(d.target.value ? parseInt(d.target.value) : undefined)} placeholder="Y"/>
  </>
};