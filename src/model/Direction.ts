export type Direction = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW";

export const directionToArrow = (direction?: Direction): string => {
  switch (direction) {
    case "N": return "↑";
    case "NE": return "↗";
    case "E": return "→";
    case "SE": return "↘";
    case "S": return "↓";
    case "SW": return "↙";
    case "W": return "←";
    case "NW": return "↖";
    default: return "";
  }
};
