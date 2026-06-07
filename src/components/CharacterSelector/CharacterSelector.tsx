import { Component, createEffect, createMemo, createSignal, For } from "solid-js";

import styles from "./CharacterSelector.module.css";
import { Canvas, Image } from "../../../solid-canvas/src";
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
    {/* <span>{props.name}:</span> */}
    <For each={Object.entries(props.obj)}>{([key, value]) =>
      <label class={styles.inline}>
        <input
          type="radio"
          name={props.name}
          value={value}
          checked={props.value === value}
          onChange={() => props.onChange(value)}
          style={{
            position: "absolute",
            opacity: 0,
            height: 0,
            width: 0,              
          }}
        />
        <Canvas style={{background: "transparent"}} width={32} height={64}>
          <Image
            transform={{
              position: {
                x: -16,
                y: 0,
              }
            }}
            style={{
              sourceOffset: { x: 0, y: 32 * parseInt(value) },
              sourceDimensions: { width: 32, height: 32 },
              dimensions: { width: 64, height: 64 },
              smoothingQuality: "none",
            }}
            image={`characters/${props.name}.png`}
          />          
        </Canvas>
      </label>  
    }</For>
  </>
}

type Props<T = DinoName | CharacterName> = {
  selectedCharacter: T;
  onSelectedCharacterChange: (character: T) => void;
  name?: string;
};

export const CharacterSelector: Component<Props> = (props) => {
  const parts = props.selectedCharacter.split("");
  const [body, setBody] = createSignal(parts[0]);
  const [headGear, setHeadGear] = createSignal(parts[1]);
  const [hair, setHair] = createSignal(parts[2]);
  const [facialHair, setFacialHair] = createSignal(parts[3]);
  const [attribute, setAttribute] = createSignal(parts[4]);
  const [jacket, setJacket] = createSignal(parts[5]);
  const [top, setTop] = createSignal(parts[6]);
  const [bottom, setBottom] = createSignal(parts[7]);
  const [shoes, setShoes] = createSignal(parts[8]);
  const character = createMemo<CharacterName>(() => {
    // TODO: check if dino
    return `${body()}${headGear()}${hair()}${facialHair()}${attribute()}${jacket()}${top()}${bottom()}${shoes()}` as CharacterName;
  });

  createEffect(() => {
    props.onSelectedCharacterChange(character());
  });

  createEffect(() => {
    const parts = props.selectedCharacter.split("");
    setBody(parts[0]);
    setHeadGear(parts[1]);
    setHair(parts[2]);
    setFacialHair(parts[3]);
    setAttribute(parts[4]);
    setJacket(parts[5]);
    setTop(parts[6]);
    setBottom(parts[7]);
    setShoes(parts[8]);
  });

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
            name={props.name ?? "Player"}
            username="IDENTIFiER"
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
          <OptionList name="Top" obj={Top} onChange={setTop} value={top()}/>
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