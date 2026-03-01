import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import BottomBar from "../components/BottomBar";
import GameView from "../components/GameView";
import { LiveKitRoom } from "../components/LiveKitRoom";
import { useToken, type ConnectionDetails } from "../utils/token";
import { WebAudioContext } from "../providers/webAudio";
import { Corridor } from "./Corridor";

type Props = {
  name?: string;
};

const Room: Component<Props> = (props) => {
  const [connect, setConnect] = createSignal(false);
  const [connectionDetails, setConnectionDetails] =
    createSignal<ConnectionDetails | null>(null);
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

  createEffect(() => {
    const result = useToken();
    if ("error" in result) {
      setConnectionDetails(null);
    } else {
      setConnectionDetails(result);
    }
  });

  return (
    <Show
      when={connect() && connectionDetails()}
      fallback={<Corridor onEnter={() => setConnect(true)}/>}
    >
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
    </Show>
  )
};

export default Room;
