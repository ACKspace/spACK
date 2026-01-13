import { createSignal, Match, Switch, type Component } from 'solid-js';
import { Toaster } from "solid-toast";
import Lobby from './pages/Lobby';
import Room from './pages/Room';

const App: Component = () => {
  const [roomName, setRoomName] = createSignal("");
 
  return (
    <main>
      <Toaster />
      <Switch fallback={<Lobby onRoom={setRoomName}/>}>
        <Match when={roomName()}>
          <Room name={roomName()} />
        </Match>
      </Switch>
    </main>
  );
};

export default App;
