// NOTE: we need to move this to an endpoint
import { AccessToken, CreateOptions, Room, RoomServiceClient } from "livekit-server-sdk";
import { type CharacterName } from "../components/CharacterSelector/CharacterSelector";


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

const apiKey = "devkey";
const apiSecret = "secret";
const wsUrl = import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:7880";

type ReturnType = { token: string; ws_url: string } | { error: string }

export const useToken = async (roomName: string, username: string, character: CharacterName): Promise<ReturnType> => {
  if (!apiKey || !apiSecret || !wsUrl) {
    throw new TypeError( "Server misconfigured" );
  }

  if (!username) throw new TypeError( "Missing username" );
  if (!character) throw new TypeError( "Missing character" );
  if (!roomName) throw new TypeError( "Missing room_name" );

  // Create room that will last at least 10 days
  const at = new AccessToken(apiKey, apiSecret, { identity: username, ttl: "10 days" });
  const room = await getOrCreateRoom(roomName);
  console.log("ROOM", room.toJson());

  const livekitHost = wsUrl?.replace("wss://", "https://");
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
  try {
    await roomService.getParticipant(roomName, username);
    return { error: "Username already exists in room" };
  } catch {
    // If participant doesn't exist, we can continue
  }


  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });
  at.metadata = JSON.stringify({ character });
  return { token: await at.toJwt(), ws_url: wsUrl };
};

const getOrCreateRoom = async (roomName: string): Promise<Room> => {
  const livekitHost = wsUrl?.replace("wss://", "https://");
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  // Hack to make the /twirp path relative..
  roomService.rpc.prefix = roomService.rpc.prefix.replace(/^\//,"");

  // List rooms
  const rooms = await roomService.listRooms();

  const activeRoom = rooms.find((activeRoom) => activeRoom.name === roomName);

  if (activeRoom) return activeRoom;
  
  // create a new room
  const opts: CreateOptions = {
    name: roomName,
    emptyTimeout: 120,
    maxParticipants: 20,
    departureTimeout: 10 * 24 * 60 * 60, // 10 days
  };

  const room = await roomService.createRoom(opts);
  console.log("Room created", room);
  return room;
}

export const setRoomMetaData = async (room: string, metadata: string): Promise<number> => {
  const livekitHost = wsUrl?.replace("wss://", "https://");
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  // Hack to make the /twirp path relative..
  roomService.rpc.prefix = roomService.rpc.prefix.replace(/^\//,"");

  await roomService.updateRoomMetadata(room, metadata);
  return new Blob([metadata]).size;
};
