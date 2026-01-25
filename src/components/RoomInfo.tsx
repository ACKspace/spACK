import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { useParticipants } from "../utils/useParticipants";

export type RoomInfo = {
  num_participants: number;
};

type Props = {
  roomName: string;
};

const DEFAULT_ROOM_INFO: RoomInfo = { num_participants: 0 };

export const RoomInfo: Component<Props> = (props) => {
  const [roomInfo, setRoomInfo] = createSignal<RoomInfo>(DEFAULT_ROOM_INFO);

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
    <div> {roomInfo().num_participants} Participant(s) currently in room</div>
  );
}

export default RoomInfo;
