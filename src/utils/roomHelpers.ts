import { createMemo } from "solid-js";
import { useToken } from "./token";
import toast from "solid-toast";

export const humanRoomName = createMemo(() => {
  // Display any token error
  const result = useToken();
  if ("error" in result) {
    // toast.error(result.error); // Will show "uninitialized"
    return "";
  }
  // Extract room name from token
  return decodeURI(result.room);
});
