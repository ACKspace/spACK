import { createEffect, createSignal, onMount, ParentComponent } from "solid-js";
import { TokenContext } from "./token";
import { Token, useToken } from "../utils/token";

export const TokenProvider: ParentComponent = (props) => {
  const [token, setToken] = createSignal<Token>(useToken.latest);

  createEffect(() => {
    setToken(useToken.latest);
  });
  return (
    <TokenContext.Provider value={token}>
      {props.children}
    </TokenContext.Provider>
  )
};