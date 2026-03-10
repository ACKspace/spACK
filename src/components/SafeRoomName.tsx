import { Component, createMemo } from "solid-js";
import { useTokenContext } from "../providers/token";
import toast from "solid-toast";

export const SafeRoomName: Component = () => {
  const roomInfo = useTokenContext();
  const roomName = createMemo(() => {
    const info = roomInfo();
    if ("error" in info) {
      toast.error(info.error);
      return "";
    }
    // Extract room name from token
    return decodeURI(info.room);
  });

  return (
    <>{roomName()}</>
  );
};

export default SafeRoomName;