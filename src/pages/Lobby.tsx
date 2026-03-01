import { Component, createSignal, onMount } from "solid-js";
import { useMobile } from "../utils/useMobile";
import Button from "../components/Button/Button";
import Input from "../components/Input/Input";

import styles from "./pages.module.css"
import { setAttributes } from "../utils/token";

type LobbyProps = {
  onRoom?: (room?: string) => void;
}

export const Lobby: Component<LobbyProps> = (props) => {
  const [roomName, setRoomName] = createSignal("ACKspace");
  // Listen for touch events to enable the mobile flag in the rest of the application.
  useMobile();

  return (
    <div>
      <h1>Spatial ACK lobby</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAttributes("roomName", roomName());
          props.onRoom?.(roomName());
        }}
      >
        <div class={styles.panel}>
          <Input
            autofocus
            value={roomName()}
            onChange={(e) => setRoomName(e.currentTarget.value)}
            type="text"
            placeholder="Room Name"
          />
          <Button>Enter Room</Button>
        </div>
      </form>
    </div>
  );
};

export default Lobby;