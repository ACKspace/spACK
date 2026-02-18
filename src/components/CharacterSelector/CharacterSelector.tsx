import { Component, For } from "solid-js";

import styles from "./CharacterSelector.module.css";

export type CharacterName = "doux" | "mort" | "targ" | "vita";

type PreviewCharacterProps = {
  name: string;
  image: string;
  selected: boolean;
  onClick?: () => void;
};
const PreviewCharacter: Component<PreviewCharacterProps> = (props) => {
  return (
    <label class={styles.inline}>
      <input type="radio" name="character" value={props.name} checked={props.selected} onChange={() => props.onClick?.()} style={{
        opacity: 0,
        cursor: "pointer",
        height: 0,
        width: 0,              
      }} />
      <div class={props.selected ? styles.bounce : ""}>
        <img
          width={64}
          height={64}
          src={props.image}
          alt={props.name}
          style={{ "image-rendering": "pixelated" }}
        />
      </div>
      <div>{props.name}</div>
    </label>
  );
};

type Props = {
  selectedCharacter: CharacterName;
  onSelectedCharacterChange: (character: CharacterName) => void;
};

export const CharacterSelector: Component<Props> = (props) => {
  const characters: CharacterName[] = [ "doux", "mort", "targ", "vita" ];
  return (
    <For each={characters}>{(character) =>
      <PreviewCharacter
        name={character}
        image={`characters/${character}_preview.png`}
        selected={props.selectedCharacter === character}
        onClick={() => props.onSelectedCharacterChange(character)}
      />
    }</For>
  );
};

export default CharacterSelector;