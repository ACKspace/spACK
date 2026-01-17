import type { CaptureOptionsBySource, ToggleSource } from '@livekit/components-core';
import { createEffect, createSignal, ParentComponent, Show } from 'solid-js';
import { useRoomContext } from '../solid-livekit';

/** @public */
export interface TrackToggleProps<T extends ToggleSource = ToggleSource>
  extends Partial<Omit<HTMLButtonElement, 'onChange'>> {
  source: T;
  showIcon?: boolean;
  initialState?: boolean;
  onChange?: (enabled: boolean) => void;
  captureOptions?: CaptureOptionsBySource<T>;
}

/**
 * With the `TrackToggle` component it is possible to mute and unmute your camera and microphone.
 * The component uses an html button element under the hood so you can treat it like a button.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <TrackToggle source={Track.Source.Microphone} />
 *   <TrackToggle source={Track.Source.Camera} />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const TrackToggle: ParentComponent<TrackToggleProps> = (props) => {
  const room = useRoomContext();

  const [enabled, setEnabled] = createSignal(room()?.localParticipant.isMicrophoneEnabled ?? false);

  createEffect(() => {
    room()?.localParticipant.setMicrophoneEnabled(enabled());
  });

  return (
    <>
      <button onclick={() => {
        setEnabled((old) => !old);
      }}>
        <Show when={props.showIcon ?? true}>
          {enabled() ? "enabled" : "disabled"}        
        </Show>
        {props.children}
      </button>
    </>
  );
}
