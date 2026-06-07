import { Component, createEffect, createSignal, onMount } from "solid-js";
import { MicrophoneMuteButton } from "./MicrophoneMuteButton";
import { MicrophoneSelector } from "./MicrophoneSelector";
import CharacterSelector from "./CharacterSelector/CharacterSelector";
import { DinoName } from "../canvas/Dino";
import { CharacterName } from "../canvas/Character";
import { useRoomContext } from "../solid-livekit";
import { gameState, setGameState } from "../model/GameState";
import Input from "./Input/Input";


export const Settings: Component = () => {
  const { room } = useRoomContext();
  const [name, setName] = createSignal(gameState.myPlayer!.name);
    
  const [selectedCharacter, setSelectedCharacter] =
    createSignal<DinoName | CharacterName>(gameState.myPlayer?.character as DinoName | CharacterName);

  createEffect(() => {
    void room()?.localParticipant.setAttributes({ character: selectedCharacter() });
    setGameState("myPlayer", "character", selectedCharacter());
  })

  createEffect(() => {
    void room()?.localParticipant.setAttributes({ name: name() });
    setGameState("myPlayer", "name", name());
  })

  return (
    <div>
      <MicrophoneMuteButton />
      <MicrophoneSelector />

      <Input
        value={name()}
        onChange={(e) => setName(e.currentTarget.value)}
        type="text"
        autofocus
        placeholder="Nickname"
      />

      <CharacterSelector
        selectedCharacter={selectedCharacter()}
        onSelectedCharacterChange={setSelectedCharacter}
        name={name()}
      />

    </div>
  );
};

export default Settings;