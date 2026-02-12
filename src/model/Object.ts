import { WorldEntity } from "./GameState";

type Type = 
  | "v" // video media
  | "a" // audio media
  | "i" // image media
  | "s" // script (web worker)

export type Object = WorldEntity & {
  image: string;
  activeImage?: string;
  type?: Type;
  uri?: string;
};

export type ObjectMeta = [x: number, y: number, image: string, activeImage?: string, type?: Type, uri?: string];
export type ObjectMetaData = {
  O: ObjectMeta[],
}
