import { Component } from "solid-js";
import { MicrophoneMuteButton } from "./MicrophoneMuteButton";
import { MicrophoneSelector } from "./MicrophoneSelector";


export const Settings: Component = () => {
  return (
    <div>
      <MicrophoneMuteButton />
      <MicrophoneSelector />
    </div>
  );
};

export default Settings;