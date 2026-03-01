import { createSignal, Show, type Component } from 'solid-js';
import { Toaster } from "solid-toast";
import Lobby from './pages/Lobby';
import Room from './pages/Room';

const App: Component = () => {
  const [roomName, setRoomName] = createSignal("");

  return (
    <main>
      <Toaster />
      <Show when={roomName()} fallback={
        <Lobby onRoom={setRoomName}/>
      }>
        <Room name={roomName()} />
      </Show>
    </main>
  );
};

export default App;
