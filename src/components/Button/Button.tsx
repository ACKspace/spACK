import { ParentComponent, splitProps } from "solid-js";

import styles from "./Button.module.css";

type Props = {
  onClick?: (event: MouseEvent) => void
};

export const Button: ParentComponent<Props> = (props) => {
  const [_, buttonProps] = splitProps(props, ["children"]);
  return (
    <button {...buttonProps} class={styles.button}>
      {props.children}
    </button>
  );
};

export default Button;