import { Component, createMemo, createSignal, Match, onCleanup, onMount, Switch } from "solid-js";
import { type ConnectionDetails } from "../types/api/connection_details";
import { CharacterSelector, type CharacterName } from "../components/CharacterSelector/CharacterSelector";
import { UsernameInput } from "../components/UsernameInput";
import toast from "solid-toast";
import RoomInfo from "../components/RoomInfo";
import BottomBar from "../components/BottomBar";
import GameView from "../components/GameView";
import { LiveKitRoom } from "../components/LiveKitRoom";
import { useToken } from "../utils/useToken";
import { WebAudioContext } from "../providers/webAudio";

type Props = {
  name?: string;
};

const Room: Component<Props> = (props) => {
  const [connectionDetails, setConnectionDetails] =
    createSignal<ConnectionDetails | null>(null);
  const [selectedCharacter, setSelectedCharacter] =
    createSignal<CharacterName>("doux");

  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(null);

  onMount(() => {
    setAudioContext(new AudioContext());
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

  const requestConnectionDetails = async (username: string) => {
    const result = await useToken(props.name ?? "", username, selectedCharacter());

    if ("error" in result) throw new TypeError(result.error);
    const { token, ws_url } = result;
    return { token, ws_url };
  };

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
              const connectionDetails = await requestConnectionDetails(
                username
              );
              setConnectionDetails(connectionDetails);
            } catch (e: any) {
              toast.error(String(e));
            }
          }}
        />
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
