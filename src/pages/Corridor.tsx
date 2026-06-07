import { batch, Component, createEffect, createMemo, createSignal, onMount, Show } from "solid-js";
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
  const [name, setName] = createSignal(`Dummy${Math.random() * 1000 | 0}`);
  const [selectedCharacter, setSelectedCharacter] =
    createSignal<DinoName | CharacterName>("1        ");
  const roomInfo = useTokenContext();
  const securityLevel = createMemo(() => {
    const info = roomInfo();
    if ("error" in info || !info.list) return 3;
    if (!info.join) return 2;
    if (!info.admin) return 1;
    return 0;
  });

  const identity = Math.random().toString(36).substring(2, 8+2);

  onMount(() => {
    document.querySelector<HTMLInputElement>("[autofocus]")?.focus();
  });

  createEffect(() => {
    if (!enter()) return;
    if (roomInfo().identity === identity) {
      props.onEnter();
    }
  })

  return <form
      onSubmit={(e) => {
        e.preventDefault();
        batch(() => {
          setAttributes("identity", identity);
          setAttributes("name", name());
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
    name={name()}
  />
  <div class={styles.panel}>
    <div class={styles.label}>Name:</div>
    <Input
      value={name()}
      onChange={(e) => setName(e.currentTarget.value)}
      type="text"
      autofocus
      placeholder="Nickname"
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