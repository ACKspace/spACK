import { createMemo } from "solid-js";
import { gameState } from "../model/GameState";

  // Optional tile attribute where the user is standing on; used for triggering tile action and debug/edit info.
export const useCurrentTileAttribute = createMemo(() => {
  if (!gameState.myPlayer) return undefined;
  const x = gameState.myPlayer.targetPos?.x;
  const y = gameState.myPlayer.targetPos?.y;
  return gameState.tileAttributes[`${x},${y}`];
});
