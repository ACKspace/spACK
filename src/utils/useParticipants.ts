import { clearCachedToken, useToken } from "./useToken";

export type RoomParticipantsInfo = {
  num_participants: number;
  list?: boolean;
  join?: boolean;
  admin?: boolean;
  error?: string;
};

export const useParticipants = async (room: string): Promise<RoomParticipantsInfo> => {
  // Create a dummy token just for the room.
  const token = await useToken(room, "DUMMY", "doux");

  if ("error" in token) {
    console.warn("Failed", token.error);
    return { num_participants: 0, error: `Token error: ${token.error}` };
  }

  try {
    const data = await (await fetch(`${token.ws_url.replace("wss://", "https://")}twirp/livekit.RoomService/ListRooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.token}`,
      },
      body: JSON.stringify({ names: [room] }),    
    })).json();

    // Status 401
    if ("msg" in data) {
      // Payload contains `msg` and `code`, not `rooms`.
      console.warn("Failed to list rooms:", data.msg);
      clearCachedToken(room);
      return { num_participants: 0, error: `Could not fetch token: ${data.msg}` };
    }

    // If room does not exist, return 0
    if (!data.rooms.length)
      return { num_participants: 0, error: "Room does not exist" };

    const { num_participants } = data.rooms[0];
    const { list, join, admin } = token;
    return { num_participants, list, join, admin };
  } catch (e) {
    console.warn("Failed to list rooms, clearing cached token.", e);
    clearCachedToken(room);
    return { num_participants: 0, error: `Fetch error: ${e?.stack ?? e?.message}` };    
  }
}

// TODO: manually create room
// https://docs.livekit.io/reference/other/roomservice-api/#createroom
