import { Component, onMount } from "solid-js";
import Input from "./Input/Input";
import { setGameState } from "../model/GameState";
import { useLocalParticipant } from "../utils/useLocalParticipant";


export const Chat: Component = () => {
  let input: HTMLInputElement;
  const { localParticipant } = useLocalParticipant();

  onMount(() => {
    input!.focus();
  });

  const keyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case "Enter":
        if (input!.value)
          localParticipant().sendText(input!.value);
        input!.value = "";
        break;

      case "Escape":
        // Close dialog
        setGameState("mode", undefined);
        break;
    }
  }

  return (
    <div>
      <span>Chat:</span>
      <Input
        ref={input!}
        name="chat"
        autocomplete="off"
        onKeyDown={keyDown}
      />
    </div>
  );
};

export default Chat;