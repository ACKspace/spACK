import { Component, createMemo, createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { CharacterSelector, type CharacterName } from "../components/CharacterSelector/CharacterSelector";
import toast from "solid-toast";
import RoomInfo from "../components/RoomInfo";
import BottomBar from "../components/BottomBar";
import GameView from "../components/GameView";
import { LiveKitRoom } from "../components/LiveKitRoom";
import { type ConnectionDetails, useToken } from "../utils/useToken";
import { WebAudioContext } from "../providers/webAudio";
import { useParticipants } from "../utils/useParticipants";
import Input from "../components/Input/Input";
import Button from "../components/Button/Button";

import styles from "./pages.module.css";

type Props = {
  name?: string;
};

const Room: Component<Props> = (props) => {
  let password: HTMLInputElement | undefined;
  const [username, setUsername] = createSignal(`Dummy${Math.random() * 1000 | 0}`);
  const [connectionDetails, setConnectionDetails] =
    createSignal<ConnectionDetails | null>(null);
  const [selectedCharacter, setSelectedCharacter] =
    createSignal<CharacterName>("doux");
  const [securityLevel, setSecurityLevel] = createSignal(0);
  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(null);

  onMount(async () => {
    setAudioContext(new AudioContext());
    const roomInfo = await useParticipants(props.name ?? "");
    if (!roomInfo.list)
      setSecurityLevel(2);
    else if (!roomInfo.admin)
      setSecurityLevel(1);
  });
  onCleanup(() => {
    setAudioContext((prev) => {
      prev?.close();
      return null;
    });
  });

  const humanRoomName = createMemo(() => {
    return decodeURI(props.name ?? "");
  });

  return (
    <Switch fallback={
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const result = await useToken(props.name ?? "", username(), selectedCharacter(), password?.value);
                if ("error" in result) throw new TypeError(result.error);

                setConnectionDetails(result);
              } catch (e: any) {
                toast.error(String(e));
              }
            }}
          >
        <h2>{humanRoomName()}</h2>
        <RoomInfo roomName={props.name ?? ""} />
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
            <div class={styles.label}>{s() === 1 ? "Admin password:": "Password:"}</div>
            <Input type="password" ref={password}/>
            </div>
        }</Show>
        
        <Button>Join</Button>
      </form>
    }>
      <Match when={!audioContext()}>NO AUDIO CONTEXT</Match>
      <Match when={connectionDetails()}>
        <LiveKitRoom
          token={connectionDetails()!.token}
          serverUrl={connectionDetails()!.ws_url}
          connect={true}
          connectOptions={{ autoSubscribe: false }}
          options={{ webAudioMix: { audioContext: audioContext()! } }}
        >
          <WebAudioContext.Provider value={audioContext()!}>
            <GameView />
            <BottomBar />
          </WebAudioContext.Provider>
        </LiveKitRoom>
      </Match>
    </Switch>
  )
};

export default Room;
