import { Component, createSignal, onMount } from "solid-js";
import { useMobile } from "../utils/useMobile";
import Button from "../components/Button/Button";

type LobbyProps = {
  onRoom?: (room?: string) => void;
}

const Lobby: Component<LobbyProps> = (props) => {
  const [roomName, setRoomName] = createSignal("Dark");
  // Listen for touch events to enable the mobile flag in the rest of the application.
  useMobile();

  let ref!: HTMLInputElement;
  onMount(() => {
    ref.focus();
  });
  return (
    <div>
      <h1>Spatial ACK lobby</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          props.onRoom?.(roomName());
        }}
      >
        <div>
          <div>
            <input
              ref={ref}
              value={roomName()}
              onChange={(e) => setRoomName(e.currentTarget.value)}
              type="text"
              placeholder="Room Name"
            />
            <Button>Enter Room</Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Lobby;