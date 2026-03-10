import { createEffect, createResource, on, ResourceFetcher } from "solid-js";
import { createStore } from "solid-js/store";
import { Direction } from "../model/Direction";
import { gameState } from "../model/GameState";
import { DinoName } from "../canvas/Dino";
import { CharacterName } from "../canvas/Character";
import { useTokenContext } from "../providers/token";

export type ConnectionDetails = {
  token: string;
  ws_url: string;
};

type Rights = {
  list: boolean;
  join: boolean;
  admin: boolean;
  expires: number;
  room: string;
  user: string;
}

type ErrorResponse = {
  error: string;
};

export type Token = ConnectionDetails & Rights | ErrorResponse;

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
let timer: number | undefined;
function inspectToken(token?: string, ws_url?: string, room?: string, user?: string): Token
{
  if(!token || !ws_url) return { error: "No token"};

  const [_header, payload, _signature] = token.split(".").map(base64urlDecode);
  const jwtData = JSON.parse(payload);

  if (user && jwtData.sub !== user) return { error: "Invalid user"};
  if (room && jwtData.video.room !== room) return  { error: "Invalid room"};
  const expires = jwtData.exp;

  const expiringSeconds = expires - (Date.now() / 1000);
  if (expiringSeconds < 300) return { error: "Expiring"};

  if (timer) clearTimeout(timer);
  timer = window.setTimeout(() => refetch("expiring"), (expiringSeconds - 300) * 1000);

  const { roomList: list, roomJoin: join, roomAdmin: admin } = jwtData.video;
  const result = { token, ws_url, list, join, admin, expires, room: jwtData.video.room, user: jwtData.sub };

  // Debug data:
  if (gameState.debugMode) {
    result.JWT = jwtData;
  }

  // Valid, return full token and details
  return result;
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

const delay = async (t: number) => new Promise((r) => setTimeout(r, t));

// Need to have something cross-room: direction and position as well
type TokenData = {
  roomName: string;
  user: string; // TODO: separate name and username
  password?: string;

  // Attributes
  position?: {x: number, y: number };
  direction?: Direction;
  character?: DinoName | CharacterName;
}

/**
 * Fetch token
 * @param tokenData The token data to generate a token for
 * @returns token or error on failure
 */
const fetchToken: ResourceFetcher<TokenData, Token, string> = async (tokenData: TokenData, { refetching, value }) => {
  // Try and find cached token depending on the room and user
  const token = inspectToken(sessionStorage["token"], sessionStorage["url"], tokenData.roomName, tokenData.user);

  // TODO:
  // attributes.character
  // attributes.direction
  // attributes.position

  // If password has changed, always refetch from server, not storage
  if (["password", "expiring", "expired"]. includes(refetching) || "error" in token) {
    // Force a fetch from server, update the session storage and timer
    // NOTE: if the participant already is in the room, they will be kicked out
    const liveKitToken = await (await fetch(import.meta.env.VITE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room: tokenData.roomName, user: tokenData.user, character: tokenData.character, password: tokenData.password, debug: gameState.debugMode }),    
    })).json() as Token;

    if ("error" in liveKitToken) return liveKitToken;

    // Update token
    // TODO: per-room?
    sessionStorage["token"] = liveKitToken.token;
    sessionStorage["url"] = liveKitToken.ws_url;
    return inspectToken(liveKitToken.token, liveKitToken.ws_url, tokenData.roomName, tokenData.user);
  }

  return token;
};

const [attributes, setAttributes] = createStore<TokenData>({
  roomName: "Dark",
  user: "DUMMY",
  position: {x: 0, y: 0},
  direction: "N",
  character: "doux"
});

const [token, { refetch, mutate }] = createResource<Token, TokenData, string>(
  attributes,
  fetchToken,
  { initialValue: { error: "not initialized" } },
);

createEffect(
  on(() => [attributes.roomName, attributes.user, attributes.password],
  ([_room, _user, password], oldValues) => {
    // When room, user or password change, force a token refetch
    if (oldValues && oldValues[2] !== password)
      refetch("password");
    else
      refetch(); // Note: it's a promise
  }),
);

// TODO: only set attributes if token is not invalid (new tokens have attributes inherently)
// attributes.character
// attributes.direction
// attributes.position

export { setAttributes };
export const useToken = token;

/**
 * Set room meta data (used for room admins/editors)
 *
 * @param room The name of the room
 * @param metadata The metadata to set.
 * @returns The size of the metadata in bytes
 */
export async function setRoomMetaData(room: string, metadata: string): Promise<number>
{
  const roomInfo = useTokenContext();
  if ("error" in roomInfo()) {
    console.warn("No valid cached token to use");
    return 0;
  }

  // TODO: we can check for token.admin or just let it error out

  try {
    const data = await (await fetch(`${roomInfo().ws_url.replace("wss://", "https://")}twirp/livekit.RoomService/UpdateRoomMetadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${roomInfo().token}`,
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
    clearCachedToken();
    return 0;
  }
};

export function clearCachedToken() {
  // TODO: remove per room.
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("url");  
}
