import { createSignal, Show, type Component } from 'solid-js';
import { Toaster } from "solid-toast";
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import { TokenProvider } from './providers/TokenContext';

const App: Component = () => {
  const [roomName, setRoomName] = createSignal("");

  return (
    <main>
      <TokenProvider>
        <Toaster />
        <Show when={roomName()} fallback={
          <Lobby onRoom={setRoomName}/>
        }>
          <Room name={roomName()} />
        </Show>
      </TokenProvider>
    </main>
  );
};

export default App;
