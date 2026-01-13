import { Component } from "solid-js";
import { MicrophoneMuteButton } from "./MicrophoneMuteButton";
import { MicrophoneSelector } from "./MicrophoneSelector";

const BottomBar: Component = () => {
  return (
    <div style={{ position: "fixed", bottom: 0, right: 0 }}>
      <MicrophoneMuteButton />
      <MicrophoneSelector />
    </div>
  );
}

export default BottomBar;
