import { Component, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import GameView from "../components/GameView";
import { LiveKitRoom } from "../components/LiveKitRoom";
import { type ConnectionDetails } from "../utils/token";
import { WebAudioContext } from "../providers/webAudio";
import { Corridor } from "./Corridor";
import { useTokenContext } from "../providers/token";

type Props = {
  name?: string;
};

const Room: Component<Props> = (props) => {
  const [connect, setConnect] = createSignal(false);
  const [connectionDetails, setConnectionDetails] =
    createSignal<ConnectionDetails | null>(null);
  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(null);
  const roomInfo = useTokenContext();

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
    const info = roomInfo();
    if ("error" in info) {
      setConnectionDetails(null);
    } else {
      setConnectionDetails(info);
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
        </WebAudioContext.Provider>
      </LiveKitRoom>
    </Show>
  )
};

export default Room;
