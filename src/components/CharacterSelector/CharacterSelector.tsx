import { Component, createEffect, createMemo, createSignal, For } from "solid-js";

import styles from "./CharacterSelector.module.css";
import { Canvas } from "../../../solid-canvas/src";
import { Attribute, Body, Bottom, Character, CharacterName, FacialHair, Hair, HeadGear, Jacket, Shoes, Top } from "../../canvas/Character";
import { DinoName } from "../../canvas/Dino";

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

type OptionListProps = {
  obj: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
  name: string;
}
const OptionList: Component<OptionListProps> = (props) => {
  return <>
    <span>{props.name}:</span>
    <For each={Object.entries(props.obj)}>{([key, value]) =>
      <label class={styles.inline}>
        <input
          type="radio"
          name={props.name}
          value={value}
          checked={props.value === value}
          onChange={() => props.onChange(value)}
          style={{
            opacity: 0,
            cursor: "pointer",
            height: 0,
            width: 0,              
          }}
        />
        <div>{key}</div>
      </label>  
    }</For>
  </>
}

type Props<T = DinoName | CharacterName> = {
  selectedCharacter: T;
  onSelectedCharacterChange: (character: T) => void;
};

export const CharacterSelector: Component<Props> = (props) => {
  // const characters: CharacterName[] = [ "doux", "mort", "targ", "vita" ];
  const [body, setBody] = createSignal("0");
  const [headGear, setHeadGear] = createSignal(" ");
  const [hair, setHair] = createSignal("0");
  const [facialHair, setFacialHair] = createSignal(" ");
  const [attribute, setAttribute] = createSignal(" ");
  const [jacket, setJacket] = createSignal("0");
  const [top, setTop] = createSignal("0");
  const [bottom, setBottom] = createSignal(" ");
  const [shoes, setShoes] = createSignal(" ");
  const character = createMemo<CharacterName>(() => {
    // TODO: check if dino
    return `${body()}${headGear()}${hair()}${facialHair()}${attribute()}${jacket()}${top()}${bottom()}${shoes()}` as CharacterName;
  });

  createEffect(() => {
    props.onSelectedCharacterChange(character());
  })
  return (
    <div class={styles.container}>
      <div>
        {/* TODO: proper size */}
        <Canvas style={{background: "transparent"}} width={150} height={150}>
          <Character
            animation="idle"
            character={character()}
            direction="S"
            position={{x:30, y: 80}}
            username="Player"
          />
        </Canvas>
      </div>
      <div>
        <div>
          <OptionList name="Body" obj={Body} onChange={setBody} value={body()}/>
        </div>
        <div>
          {/* <OptionList name="Headgear" obj={HeadGear} onChange={setHeadGear} value={headGear()}/> */}
        </div>
        <div>
          <OptionList name="Hair" obj={Hair} onChange={setHair} value={hair()}/>
        </div>
        <div>
          {/* <OptionList name="FacialHair" obj={FacialHair} onChange={setFacialHair} value={facialHair()}/> */}
        </div>
        <div>
          {/* <OptionList name="Attribute" obj={Attribute} onChange={setAttribute} value={attribute()}/> */}
        </div>
        <div>
          <OptionList name="Jacket" obj={Jacket} onChange={setJacket} value={jacket()}/>
        </div>
        <div>
          <OptionList name="Outfit" obj={Top} onChange={setTop} value={top()}/>
        </div>
        <div>
          {/* <OptionList name="Bottom" obj={Bottom} onChange={setBottom} value={bottom()}/> */}
        </div>
        <div>
          {/* <OptionList name="Shoes" obj={Shoes} onChange={setShoes} value={shoes()}/> */}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelector;