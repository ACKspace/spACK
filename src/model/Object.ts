import { WorldEntity } from "./GameState";

type Type = 
  | "v" // video media
  | "a" // audio media
  | "i" // image media
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
  O: ObjectMeta[],
}
