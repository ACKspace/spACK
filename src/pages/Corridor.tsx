import { batch, Component, createEffect, createMemo, createSignal, Show } from "solid-js";
import { setAttributes } from "../utils/token";
import RoomInfo from "../components/RoomInfo";
import Input from "../components/Input/Input";
import Button from "../components/Button/Button";
import { DinoName } from "../canvas/Dino";
import { CharacterName } from "../canvas/Character";
import CharacterSelector from "../components/CharacterSelector/CharacterSelector";
import { useTokenContext } from "../providers/token";
import SafeRoomName from "../components/SafeRoomName";

import styles from "./pages.module.css";

export const Corridor: Component<{onEnter: () => void}> = (props) => {
  let password: HTMLInputElement | undefined;
  const [enter, setEnter] = createSignal(false);
  const [username, setUsername] = createSignal(`Dummy${Math.random() * 1000 | 0}`);
  const [selectedCharacter, setSelectedCharacter] =
    createSignal<DinoName | CharacterName>("doux");
  const roomInfo = useTokenContext();
  const securityLevel = createMemo(() => {
    const info = roomInfo();
    if ("error" in info || !info.list) return 3;
    if (!info.join) return 2;
    if (!info.admin) return 1;
    return 0;
  });

  createEffect(() => {
    if (!enter()) return;
    if (roomInfo().user === username()) {
      props.onEnter();
    }
  })

  return <form
      onSubmit={(e) => {
        e.preventDefault();
        batch(() => {
          setAttributes("user", username());
          setAttributes("character", selectedCharacter());
          setAttributes("password", password?.value);
        });

        setEnter(true);
      }}
    >
  <h2><SafeRoomName/></h2>
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