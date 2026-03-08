import { Component } from "solid-js";
import { TileInformation } from "./Tiles/TileInformation";
import TileSelector from "./Tiles/TileSelector";
import { useCurrentTileAttribute } from "../utils/useCurrentTileAttribute";


export const Editor: Component = () => {
  return (
    <div>
      <TileInformation param={useCurrentTileAttribute()}/>
      <TileSelector/>
    </div>
  );
};

export default Editor;