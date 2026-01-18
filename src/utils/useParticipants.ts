// NOTE: we need to move this to an endpoint
import { RoomServiceClient } from "livekit-server-sdk";

export type RoomInfo = {
  num_participants: number;
};

const apiKey = "devkey";
const apiSecret = "secret";
const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:7880";

export const useParticipants = async (room: string): Promise<{ num_participants: number }> => {
  if (!apiKey || !apiSecret || !wsUrl) {
    throw new TypeError( "Server misconfigured" );
  }

  const livekitHost = wsUrl?.replace("wss://", "https://"); // TODO: WUT?
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  // Hack to make the /twirp path relative..
  roomService.rpc.prefix = roomService.rpc.prefix.replace(/^\//,"");

  try {
    const participants = await roomService.listParticipants(room);
    return { num_participants: participants.length };
  } catch {
    return { num_participants: 0 };
  }
}
