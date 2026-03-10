import { batch, Component } from "solid-js";
import { gameState, setGameState } from "../model/GameState";
import Button from "./Button/Button";
import toast from "solid-toast";
import { getRandomSpawnPosition } from "../utils/useGameStateManager";
import { tileSize } from "../model/Tile";
import { useTokenContext } from "../providers/token";


export const Debug: Component = () => {
  const roomInfo = useTokenContext();
  return (
    <div>
        ROOM: {roomInfo().room} {gameState.base}<br/>
        {/* offset:{gameState.cameraOffset.x},{gameState.cameraOffset.y}<br/>
        map:{gameState.mapSize.x},{gameState.mapSize.x}<br/>
        current object: {gameState.currentObject?.image} {gameState.currentObject?.active ? "ACTIVE" : "none"}<br/> */}
        <Button onClick={async () => {
          try {
            await navigator.clipboard.writeText(import.meta.env.VITE_VERSION);
            toast.success("Version copied to clipboard");
          } catch {
            toast.error("Clipboard error");
          }
        }}>{import.meta.env.VITE_VERSION} 📋</Button><br/>
        <Button onClick={() => {
          const [spawn, direction] = getRandomSpawnPosition()
          batch(() => {
            setGameState("myPlayer", "targetPos", spawn);
            setGameState("myPlayer", "position", {x: spawn.x * tileSize, y: spawn.y * tileSize});
          })
          if (direction)
            setGameState("myPlayer", "direction", direction);            
        }}>spawn point</Button>
    </div>
  );
};

export default Debug;