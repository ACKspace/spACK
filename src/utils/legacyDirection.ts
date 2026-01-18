import { Direction } from "../model/Direction";

export const directionToLeftRight = (direction: Direction): "left" | "right" => {
  switch (direction) {
    case "N":
    case "NE":
    case "E":
    case "SE":
      return "right";
    // S, SW, W, NW
    default:
      return "left"
  }
}

/** @deprecated Used for compatibility with old protocol */
export const leftRightToDirection = (legacyDirection: "left" | "right"): Direction => {
  return legacyDirection === "left" ? "W" : "E";
}
