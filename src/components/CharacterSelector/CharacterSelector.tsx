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
    <div
      class={styles.inline}
      onClick={() => props.onClick?.()}
    >
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
    </div>
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