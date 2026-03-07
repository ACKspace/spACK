import { Direction } from "../model/Direction";

export function directionToIndex(direction: Direction): number {
  // S E N W
  switch (direction) {
    case "S": return 0;
    case "E": return 1;
    case "N": return 2;
    case "W": return 3;

    case "SW": return 3;
    case "SE": return 1;
    case "NE": return 1;
    case "NW": return 3;
    default: return 0;
  }
}