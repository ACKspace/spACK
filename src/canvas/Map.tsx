import { Component, createMemo, createSignal } from "solid-js";
import { ImageSource } from "../../solid-canvas/src/types";
import { gameState, setGameState } from "../model/GameState";
import { tileSize } from "../model/Tile";
import { Image } from "../../solid-canvas/src";
import { Vector2 } from "../model/Vector2";

type Props = {
  /** The image we want to load as map */
  image: ImageSource;

  /** Whether the image is an overlay or primary base background */
  overlay?: boolean;
};

export const Map: Component<Props> = (props) => {
  const [imageSize, setImageSize] = createSignal<Vector2>({x:0, y: 0});

  return<Image
    onLoad={(image) => {
      // Determine level boundaries
      if (image.width instanceof SVGAnimatedLength || image.height instanceof SVGAnimatedLength) throw new TypeError("Expected raster image");
      setImageSize({
        x: image.width,
        y: image.width,
      })

      // Update world
      setGameState("mapSize", {
        x: Math.floor(imageSize().x / tileSize),
        y: Math.floor(imageSize().y / tileSize),
      });
    }}
    style={{
      // sourceOffset: {x:0, y: 0},
      sourceDimensions: { width: imageSize().x, height: imageSize().y },
      dimensions: { width: imageSize().x, height: imageSize().y },
      pointerEvents: false,
    }}
    transform={{
      position: {x: 0, y: 0}
    }}
    image={props.image}
  />;
};