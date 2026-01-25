import { batch, Component, For } from "solid-js"
import styles from "./NavigationButtons.module.css";
import { inputBits, toggleBit } from "../../utils/useGameStateManager";

const directions = ["up", "down", "left", "right"];
const pointers = new Set<number>();

/**
 * Simple navigation buttons component.
 * This could user a lot of love, but for now, it works.
 *
 * @returns component with 4 "button"-like elements that show the active direction.
 */
export const NavigationButtons: Component = () => {
  let div!: HTMLDivElement;
  const pointerEvent = (event: PointerEvent) => {
    if (event.type === "pointerdown") {
      div.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
      pointers.add(event.pointerId);
    }

    if (!pointers.has(event.pointerId)) return;
    const xRatio = event.offsetX / div.offsetWidth;
    const yRatio = event.offsetY / div.offsetHeight;

    batch(() => {
      toggleBit(0, false);
      toggleBit(1, false);
      toggleBit(2, false);
      toggleBit(3, false);
      if (["pointercancel", "pointerup"].includes(event.type)) {
        pointers.delete(event.pointerId);
      } else {
        if (yRatio < 1 / 3) toggleBit(0, true);
        if (yRatio > 2 / 3) toggleBit(1, true);
        if (xRatio < 1 / 3) toggleBit(2, true);
        if (xRatio > 2 / 3) toggleBit(3, true);
      }
    });
  }

  return <div
    ref={div}
    class={styles.container}
    onPointerDown={pointerEvent}
    onPointerCancel={pointerEvent}
    onPointerUp={pointerEvent}
    onPointerMove={pointerEvent}
    onContextMenu={(event) => {event.preventDefault();}}
  >
    <For each={directions}>{(direction, idx) =>
      <>
        <span class={`${styles[direction]} ${inputBits()[idx()] ? styles.active : ""}`}
        >{direction}</span>
      </>
    }</For>
  </div>
}
