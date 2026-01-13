import { Component, For } from "solid-js";
import { useMediaDeviceSelect, useRoomContext } from "../solid-livekit";

export const MicrophoneSelector: Component = () => {
  // TODO remove roomContext, this is only needed because of a bug in `useMediaDeviceSelect`
  const roomContext = useRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice } =
  useMediaDeviceSelect({ kind: "audioinput", room: roomContext() });

  return (
    <div>
      <div>
        <select
          onChange={(e) => {
            setActiveMediaDevice(e.currentTarget.value);
          }}
          value={activeDeviceId()}
        >
          <option value={-1} disabled>
            Choose your microphone
          </option>
          <For each={devices()}>{(m) =>
            <option value={m.deviceId}>
              {m.label}
            </option>
            }</For>
        </select>
      </div>
    </div>
  );
}
