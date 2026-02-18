import { Component, JSX, splitProps } from "solid-js";

import styles from "./Input.module.css";

type Props = JSX.InputHTMLAttributes<HTMLInputElement>;

export const Input: Component<Props> = (props) => {
  return (
    <input {...props} class={styles.input}/>
  );
};

export default Input;