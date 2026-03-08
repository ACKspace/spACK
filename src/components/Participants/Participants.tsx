import { Component, createMemo, For, Show } from "solid-js";
import { gameState } from "../../model/GameState";
import { type RemoteParticipant } from "livekit-client";

// import styles from "./Participants.module.css";

type Props = {
  participants?: RemoteParticipant[];
};

export const Participants: Component<Props> = (props) => {
  const participants = createMemo(() => {
    if (props.participants) return props.participants.map(participant => ({username: participant.identity, speaking: false}));
    return gameState.remotePlayers;
  });

  return (
    <div>
      <div>Participant list</div>
      <Show when={gameState.myPlayer} keyed>{(myPlayer)=>
        <div>{myPlayer.username} (you)</div>
      }</Show>
      <For each={participants()}>{(participant) => <div>
        {participant.username}{participant.speaking ? "🗣️" : ""}
      </div>}</For>
    </div>
  );
};

export default Participants;