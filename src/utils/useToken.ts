import { type CharacterName } from "../components/CharacterSelector/CharacterSelector";

export type ConnectionDetails = {
  token: string;
  ws_url: string;
};

type Rights = {
  list: boolean;
  join: boolean;
  admin: boolean;
}

type ErrorResponse = {
  error: string;
};

type ReturnType = ConnectionDetails & Rights | ErrorResponse;

/**
 * Inspect token validity
 *
 * @param token The JWT to inspect; optional to allow empty cache
 * @param ws_url The corresponding LiveKit URL for the token; optional to allow empty cache
 * @param room The name of the room to verify; optional
 * @param user The name of the user to verify; optional
 *
 * @returns Token if valid and not expired over 5 minutes; error otherwise
 */
function inspectToken(token?: string, ws_url?: string, room?: string, user?: string): ReturnType
{
  if(!token || !ws_url) return { error: "No token"};

  const [_header, payload, _signature] = token.split(".").map(base64urlDecode);
  const jwtData = JSON.parse(payload);

  if (user && jwtData.sub !== user) return { error: "No user"};
  if (room && jwtData.video.room !== room) return  { error: "No room"};
  if (jwtData.exp < (Date.now() / 1000) - 300) return { error: "Expiring"};

  const { roomList: list, roomJoin: join, roomAdmin: admin } = jwtData.video;

  // Valid, return full token and details
  return { token, ws_url, list, join, admin };
}

/**
 * Base64 URL decode
 *
 * @param data Base 64 URL encoded data
 * @returns decoded data
 */
function base64urlDecode(data: string): string
{
  return atob(data.replace(/_/g, '/').replace(/-/g, '+')) 
}

/** Generate a token or retrieve from cache if valid */
export async function useToken(room: string, user?: string, character?: CharacterName, password?: string): Promise<ReturnType>
{
  // Retrieve from session storage, if username is still correct
  const token = inspectToken(sessionStorage["token"], sessionStorage["url"], room, user);
  if (!("error" in token)) {
    return token;
  }

  // Retrieve from server
  if (!user) throw new TypeError( "Missing username" );
  if (!room) throw new TypeError( "Missing room_name" );

  // NOTE: if the participant already is in the room, they will be kicked out
  const liveKitToken = await (await fetch(import.meta.env.VITE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ room, user, character, password }),    
  })).json() as ReturnType;

  if ("error" in liveKitToken) return liveKitToken;

  // Update token
  // TODO: per-room?
  sessionStorage["token"] = liveKitToken.token;
  sessionStorage["url"] = liveKitToken.ws_url;
  return inspectToken(liveKitToken.token, liveKitToken.ws_url, room, user);
};

/**
 * Set room meta data (used for room admins/editors)
 *
 * @param room The name of the room
 * @param metadata The metadata to set.
 * @returns The size of the metadata in bytes
 */
export async function setRoomMetaData(room: string, metadata: string): Promise<number>
{
  const token = await useToken(room);
  if ("error" in token) {
    console.warn("No valid cached token to use");
    return 0;
  }

  // TODO: we can check for token.admin or just let it error out

  try {
    const data = await (await fetch(`${token.ws_url.replace("wss://", "https://")}twirp/livekit.RoomService/UpdateRoomMetadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.token}`,
      },
      body: JSON.stringify({ room, metadata }),    
    })).json();
    if ("msg" in data) {
      // Payload contains `msg` and `code`, not `metadata`.
      console.warn("Failed to update room metadata:", data.msg);
      return 0;
    }
    // Sanity check
    if ("error" in data) {
      console.warn("Failed to update room metadata:", data.error);
      return 0;
    }
    return new Blob([data.metadata]).size;
  } catch (e) {
    console.warn("Failed to update room metadata, clearing cached token.");
    clearCachedToken(room);
    return 0;
  }
};

export function clearCachedToken(room?: string) {
  // TODO: remove per room.

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("url");  
}
