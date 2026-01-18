// NOTE: we need to move this to an endpoint
import livekitServer, {
  AccessToken,
  RoomServiceClient,
} from "livekit-server-sdk";
import { type CharacterName } from "../components/CharacterSelector";


export type ConnectionDetailsBody = {
  room_name: string;
  username: string;
  character: CharacterName;
};

export type ConnectionDetails = {
  token: string;
  ws_url: string;
};

type ErrorResponse = {
  error: string;
};

const apiKey = "devkey"; // process.env.LIVEKIT_API_KEY;
const apiSecret = "secret"; // process.env.LIVEKIT_API_SECRET;
const wsUrl = "ws://127.0.0.1:7880"; // process.env.LIVEKIT_WS_URL;

type ReturnType = { token: string; ws_url: string } | { error: string }

export const useToken = async (room: string, username: string, character: CharacterName): Promise<ReturnType> => {
  if (!apiKey || !apiSecret || !wsUrl) {
    throw new TypeError( "Server misconfigured" );
  }

  if (!username) throw new TypeError( "Missing username" );
  if (!character) throw new TypeError( "Missing character" );
  if (!room) throw new TypeError( "Missing room_name" );

  const livekitHost = wsUrl?.replace("wss://", "https://");

  const at = new AccessToken(apiKey, apiSecret, { identity: username });
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  // Hack to make the /twirp path relative..
  roomService.rpc.prefix = roomService.rpc.prefix.replace(/^\//,"");

  try {
    await roomService.getParticipant(room, username);
    return { error: "Username already exists in room" };
  } catch {
    // If participant doesn't exist, we can continue
  }

  roomService.updateRoomMetadata(room, "ASDF");

  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
  at.metadata = JSON.stringify({ character });
  return { token: await at.toJwt(), ws_url: wsUrl };
}
