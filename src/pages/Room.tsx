import { Component, createMemo, createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { CharacterSelector, type CharacterName } from "../components/CharacterSelector/CharacterSelector";
import { UsernameInput } from "../components/UsernameInput";
import toast from "solid-toast";
import RoomInfo from "../components/RoomInfo";
import BottomBar from "../components/BottomBar";
import GameView from "../components/GameView";
import { LiveKitRoom } from "../components/LiveKitRoom";
import { type ConnectionDetails, useToken } from "../utils/useToken";
import { WebAudioContext } from "../providers/webAudio";
import { useParticipants } from "../utils/useParticipants";

type Props = {
  name?: string;
};

const Room: Component<Props> = (props) => {
  let password: HTMLInputElement | undefined;
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
      <>
        <h2>{humanRoomName()}</h2>
        <RoomInfo roomName={props.name ?? ""} />
        <div>Selected: {selectedCharacter()}</div>
        <CharacterSelector
          selectedCharacter={selectedCharacter()}
          onSelectedCharacterChange={setSelectedCharacter}
        />
        <UsernameInput
          submitText="Join Room"
          onSubmit={async (username) => {
            try {
              const result = await useToken(props.name ?? "", username, selectedCharacter(), password?.value);
              if ("error" in result) throw new TypeError(result.error);

              setConnectionDetails(result);
            } catch (e: any) {
              toast.error(String(e));
            }
          }}
        />
        {/* TODO: for new rooms, allow initial password to be set */}
        <Show when={securityLevel()}>{(s) =>
          <>{s() === 1 ? "Admin password:": "Password:"}<input type="password" ref={password}/></>
        }</Show>
      </>
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
