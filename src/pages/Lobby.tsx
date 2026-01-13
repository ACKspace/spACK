import { Component, createSignal, onMount } from "solid-js";

type LobbyProps = {
  onRoom?: (room?: string) => void;
}

const Lobby: Component<LobbyProps> = (props) => {
  const [roomName, setRoomName] = createSignal("Dark");
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
            <button>Enter Room</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Lobby;