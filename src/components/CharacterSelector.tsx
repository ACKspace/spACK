import { Component, For } from "solid-js";

export type CharacterName = "doux" | "mort" | "targ" | "vita";

type Props = {
  selectedCharacter: CharacterName;
  onSelectedCharacterChange: (character: CharacterName) => void;
};

const PreviewCharacter = ({
  name,
  image,
  selected,
}: {
  name: string;
  image: string;
  selected: boolean;
}) => {
  return (
    <div>
      <div class={`${selected ? "animate-bounce" : ""}`}>
        <img
          width={64}
          height={64}
          src={image}
          alt={name}
          style={{ "image-rendering": "pixelated" }}
        />
      </div>
      <div>{name}</div>
    </div>
  );
};

export const CharacterSelector: Component<Props> = (props) => {
  const characters: CharacterName[] = [ "doux", "mort", "targ", "vita" ];
  return (
    <div>
      <For each={characters}>{(character) => <div
        onClick={() => props.onSelectedCharacterChange(character)}
      >
        <PreviewCharacter
          name={character}
          image={`/characters/${character}_preview.png`}
          selected={props.selectedCharacter === character}
        />
      </div>}</For>
    </div>
  );
};

export default CharacterSelector;