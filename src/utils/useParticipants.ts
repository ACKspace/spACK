import { clearCachedToken, useToken } from "./useToken";

export type RoomInfo = {
  num_participants: number;
};

export const useParticipants = async (room: string): Promise<{ num_participants: number }> => {
  // Create a dummy token just for the room.
  const token = await useToken(room, "DUMMY", "doux");

  if ("error" in token) {
    console.warn("Failed", token.error);
    return { num_participants: 0 };
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

    // If room does not exist, return 0
    if (!data.rooms.length)
      return { num_participants: 0 };

    const { num_participants } = data.rooms[0];
    return { num_participants };
  } catch (e) {
    console.warn("Failed to list rooms, clearing cached token.");
    clearCachedToken(room);
    return { num_participants: 0 };    
  }
}

// TODO: manually create room
// https://docs.livekit.io/reference/other/roomservice-api/#createroom
