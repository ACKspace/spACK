import { Component, createMemo, createSignal } from "solid-js";
import { ImageSource } from "../../solid-canvas/src/types";
import { gameState, setGameState } from "../model/GameState";
import { tileSize } from "../model/Tile";
import { Image } from "../../solid-canvas/src";
import { Vector2 } from "../model/Vector2";

type Props = {
  /** The image we want to load as map */
  image: ImageSource;

  /** The center of the player relative to the viewport in tile units */
  center: Vector2;
  /** The screen size in tile units (not taking pixel offset into account) */
  screen: Vector2;

  /** Whether the image is an overlay or primary base background */
  overlay?: boolean;
};

export const Map: Component<Props> = (props) => {
  const [imageSize, setImageSize] = createSignal<Vector2>({x:0, y: 0});

  const dimensions = createMemo(() => {
    const width = props.screen.x * tileSize + gameState.cameraOffset.x * 2;
    const height = props.screen.y * tileSize + gameState.cameraOffset.y * 2;

    return { width, height };
  });

  const offset = createMemo(() => {
    // Player position minus screen center and adjusted for camera pixel offset
    const x = gameState.myPlayer ? (gameState.myPlayer.position.x - props.center.x) * tileSize - gameState.cameraOffset.x : 0;
    const y = gameState.myPlayer ? (gameState.myPlayer.position.y - props.center.y) * tileSize - gameState.cameraOffset.y: 0;

    return { x, y };
  });
  
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
      sourceOffset: offset(),
      sourceDimensions: dimensions(),
      dimensions: dimensions(),
      pointerEvents: false,
    }}
    transform={{
      position: {x: 0, y: 0}
    }}
    image={props.image}
  />;
};