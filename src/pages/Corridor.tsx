import { batch, Component, createEffect, createMemo, createSignal, Show } from "solid-js";
import { setAttributes, useToken } from "../utils/token";
import CharacterSelector, { CharacterName } from "../components/CharacterSelector/CharacterSelector";
import { humanRoomName } from "../utils/roomHelpers";
import RoomInfo from "../components/RoomInfo";

import styles from "./pages.module.css";
import Input from "../components/Input/Input";
import Button from "../components/Button/Button";

export const Corridor: Component<{onEnter: () => void}> = (props) => {
  let password: HTMLInputElement | undefined;
  const [username, setUsername] = createSignal(`Dummy${Math.random() * 1000 | 0}`);
  const [selectedCharacter, setSelectedCharacter] =
    createSignal<CharacterName>("doux");
  const securityLevel = createMemo(() => {
    const roomInfo = useToken();
    if ("error" in roomInfo || !roomInfo.list) return 3;
    if (!roomInfo.join) return 2;
    if (!roomInfo.admin) return 1;
    return 0;
  });

  return <form
      onSubmit={(e) => {
        e.preventDefault();
        batch(() => {
          setAttributes("user", username());
          setAttributes("character", selectedCharacter());
          setAttributes("password", password?.value);
        });

        // await new token
        createEffect(() => {
          const roomInfo = useToken();
          if (roomInfo.user === username()) {
            props.onEnter();
          }
        });

      }}
    >
  <h2>{humanRoomName()}</h2>
  <RoomInfo />
  <CharacterSelector
    selectedCharacter={selectedCharacter()}
    onSelectedCharacterChange={setSelectedCharacter}
  />
  <div class={styles.panel}>
    <div class={styles.label}>Name:</div>
    <Input
      value={username()}
      onChange={(e) => setUsername(e.currentTarget.value)}
      type="text"
      autofocus
      placeholder="Username"
    />
  </div>
  {/* TODO: for new rooms, allow initial password to be set */}
  <Show when={securityLevel()}>{(s) =>
    <div class={styles.panel}>
      <div class={styles.label}>{s() > 1 ? "Password:": "Admin password:"}</div>
      <Input type="password" ref={password}/>
      </div>
  }</Show>
  
  <Button>Join</Button>
</form>  
}