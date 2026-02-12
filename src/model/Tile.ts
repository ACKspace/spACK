import { Direction } from "./Direction";
import { Vector2 } from "./Vector2";

export type TileAttribute =
  | "impassable"
  | "spawn"
  | "portal"
  | "private"
  | "spotlight";

type ImpassableParam = {
  type: "impassable";
  direction?: Direction;
};
type SpawnParam = {
  type: "spawn";
  direction?: Direction;
};
type PortalParam = {
  type: "portal";
  direction?: Direction;
  room: string;
  coordinate?: Vector2;
  } | {
  type: "portal";
  direction?: Direction;
  room?: string;
  coordinate: Vector2;
};
type PrivateParam = {
  type: "private";
  identifier: string;
};
type SpotlightParam = {
  type: "spotlight";
  identifier: string;
};

export type TileParam = 
  | ImpassableParam
  | SpawnParam
  | PortalParam
  | PrivateParam
  | SpotlightParam;

export const tileSize = 32;

export const tileColors: Record<TileAttribute, string> = {
  impassable: "rgba(255,0,0,0.6)",
  spawn: "rgba(0,0,255,0.6)",
  portal: "rgba(255,0,255,0.6)",
  private: "rgba(0,255,0,0.6)",
  spotlight: "rgba(255,255,0,0.6)",
}

export type ImpassableMeta = [x: number, y: number, direction?: Direction];
export type SpawnMeta = [x: number, y: number, direction?: Direction];
export type PortalMeta = [x: number, y: number, direction?: Direction, room?: string, x?: number, y?: number];
export type PrivateMeta = [x: number, y: number, identifier?: string];
export type SpotlightMeta = [x: number, y: number, identifier?: string];
export type MetaType = ImpassableMeta | SpawnMeta | PortalMeta | PrivateMeta | SpotlightMeta;

export type TileMetaData = {
  A: SpotlightMeta[], // alias Attention
  D: PortalMeta[],    // alias Door
  I: ImpassableMeta[],
  P: PrivateMeta[],
  S: SpawnMeta[],
}
