import { Track } from "livekit-client";
import { Component } from "solid-js";
import { TrackToggle } from "./TrackToggle";

export const MicrophoneMuteButton: Component = () => {
  return (
    <div>
      <TrackToggle source={Track.Source.Microphone} />
    </div>
  );
};
