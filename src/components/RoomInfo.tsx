import { Component, createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { type RoomParticipantsInfo, useParticipants } from "../utils/useParticipants";


type Props = {
  roomName: string;
};

export const RoomInfo: Component<Props> = (props) => {
  const [roomInfo, setRoomInfo] = createSignal<RoomParticipantsInfo>();

  let interval: number;
  onMount(() => {
    const fetchRoomInfo = async () => {
      const roomInfo = await useParticipants(props.roomName);
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
          <div>{r().list ? r().num_participants : "unknown amount of"} participant(s) currently in room.</div>
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
