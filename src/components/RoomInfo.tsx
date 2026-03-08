import { Component, createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { type RoomParticipantsInfo, useParticipants } from "../utils/useParticipants";
import Participants from "./Participants/Participants";


export const RoomInfo: Component = () => {
  const [roomInfo, setRoomInfo] = createSignal<RoomParticipantsInfo>();

  let interval: number;
  onMount(() => {
    const fetchRoomInfo = async () => {
      const roomInfo = await useParticipants();
      setRoomInfo(roomInfo);
    };

    interval = window.setInterval(fetchRoomInfo, 1000);
    fetchRoomInfo();
  });

  onCleanup(() => {
      clearInterval(interval);
  });

  return (
    <div>
      <Show when={roomInfo()}>{(r) =>
        <>
          <div>{r().list ? r().participants.length : "unknown amount of"} participant(s) currently in room.</div>
          <Participants participants={r().participants}/>
          <Switch>
            <Match when={!r().join}>
              This room is password protected.
            </Match>
            <Match when={!r().admin}>
              Administrators require a password.
            </Match>
          </Switch>
        </>
      }</Show>
    </div>
  );
}

export default RoomInfo;
