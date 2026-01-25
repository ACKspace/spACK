import { Component, createSignal, onMount } from "solid-js";
import Button from "./Button/Button";

type Props = {
  submitText: string;
  onSubmit: (username: string) => void;
};

export const UsernameInput: Component<Props> = (props) => {
  const [username, setUsername] = createSignal(`Dummy${Math.random() * 1000 | 0}`);
  let ref!: HTMLInputElement;
  onMount(() => {
    ref.focus();
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit(username());
      }}
    >
      <div>
        <div>
          <input
            ref={ref}
            value={username()}
            onChange={(e) => setUsername(e.currentTarget.value)}
            type="text"
            placeholder="Username"
          />
          <Button>Join</Button>
        </div>
      </div>
    </form>
  );
};

export default UsernameInput;
