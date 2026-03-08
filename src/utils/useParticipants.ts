import { clearCachedToken, useToken } from "./token";
import { type RemoteParticipant } from "livekit-client";

export type RoomParticipantsInfo = {
  list?: boolean;
  join?: boolean;
  admin?: boolean;
  error?: string;
  participants: RemoteParticipant[];
};

export const useParticipants = async (): Promise<RoomParticipantsInfo> => {
  const token = useToken();

  if ("error" in token) {
    console.warn("Failed", token.error);
    return { participants: [], error: `Token error: ${token.error}` };
  }

  try {
    const data = await (await fetch(`${token.ws_url.replace("wss://", "https://")}twirp/livekit.RoomService/ListParticipants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.token}`,
      },
      body: JSON.stringify({ room: token.room }),
    })).json();

    // Status 401
    if ("msg" in data) {
      // Payload contains `msg` and `code`, not `rooms`.
      console.warn("Failed to list rooms:", data.msg);
      clearCachedToken();
      return { participants: [], error: `Could not fetch token: ${data.msg}` };
    }

    // If room does not exist, return empty list
    return { participants: data.participants, list: token?.list, join: token?.join, admin: token?.admin };
  } catch (e) {
    console.warn("Failed to list rooms, clearing cached token.", e);
    clearCachedToken();
    return { participants: [], error: `Fetch error: ${e?.stack ?? e?.message}` };    
  }
}

// TODO: manually create room
// https://docs.livekit.io/reference/other/roomservice-api/#createroom

/**
 * Delete room and its meta data (used for room admins/editors)
 *
 * @param room The name of the room
 * @returns true upon success
 */
export async function deleteRoom(room: string): Promise<boolean>
{
  const token = useToken();
  if ("error" in token) {
    console.warn("No valid cached token to use");
    return false;
  }

  // TODO: we can check for token.admin or just let it error out

  try {
    const data = await (await fetch(`${token.ws_url.replace("wss://", "https://")}twirp/livekit.RoomService/DeleteRoom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.token}`,
      },
      body: JSON.stringify({ room }),    
    })).json();
    if ("msg" in data) {
      // Payload contains `msg` and `code`, not `metadata`.
      console.warn("Failed to delete room:", data.msg);
      return false;
    }
    // Sanity check
    if ("error" in data) {
      console.warn("Failed to delete room:", data.error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Failed to delete room:", e);
    clearCachedToken();
    return false;
  }
};
