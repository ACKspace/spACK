import { WorldEntity } from "./GameState";

type Type = 
  | "v" // video media
  | "a" // audio media
  | "i" // image media
  | "p" // page (embedded url)
  | "s" // script (web worker)

export type WorldObject = WorldEntity & {
  image: string;
  activeImage?: string;
  mediaType?: Type;
  uri?: string;
  active: boolean;
  worker?: Worker;
};

export type ObjectMeta = [x: number, y: number, image: string, activeImage?: string, mediaType?: Type, uri?: string];
export type ObjectMetaData = {
  /** Object meta data */
  O: ObjectMeta[],
}

export type GenericMetaData = {
  /** Base directory */
  B: string,
  /** Earshot radius */
  E: number,
  /** Debug mode */
  M: number;
  /** Updated timestamp */
  U: number;
}
