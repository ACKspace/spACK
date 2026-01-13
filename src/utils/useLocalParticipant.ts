import type { ParticipantMedia } from '@livekit/components-core';
import { observeParticipantMedia } from '@livekit/components-core';
import type { TrackPublication, LocalParticipant, Room } from 'livekit-client';
import { useEnsureRoom } from '../solid-livekit';
import { createSignal, createEffect, onCleanup } from 'solid-js';

/** @public */
export interface UseLocalParticipantOptions {
  /**
   * The room to use. If not provided, the hook will use the room from the context.
   */
  room?: Room;
}

/**
 * The `useLocalParticipant` hook returns the local participant and the associated state
 * around the participant.
 *
 * @example
 * ```tsx
 * const { localParticipant } = useLocalParticipant();
 * ```
 * @public
 */
export function useLocalParticipant(options: UseLocalParticipantOptions = {}) {
  const room = useEnsureRoom(options.room);
  const [localParticipant, setLocalParticipant] = createSignal(room().localParticipant);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = createSignal(
    localParticipant().isMicrophoneEnabled,
  );
  const [isCameraEnabled, setIsCameraEnabled] = createSignal(
    localParticipant().isMicrophoneEnabled,
  );
  const [lastMicrophoneError, setLastMicrophoneError] = createSignal(
    localParticipant().lastMicrophoneError,
  );
  const [lastCameraError, setLastCameraError] = createSignal(localParticipant().lastCameraError);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = createSignal(
    localParticipant().isMicrophoneEnabled,
  );
  const [microphoneTrack, setMicrophoneTrack] = createSignal<TrackPublication | undefined>(
    undefined,
  );
  const [cameraTrack, setCameraTrack] = createSignal<TrackPublication | undefined>(undefined);

  const handleUpdate = (media: ParticipantMedia<LocalParticipant>) => {
    setIsCameraEnabled(media.isCameraEnabled);
    setIsMicrophoneEnabled(media.isMicrophoneEnabled);
    setIsScreenShareEnabled(media.isScreenShareEnabled);
    setCameraTrack(media.cameraTrack);
    setMicrophoneTrack(media.microphoneTrack);
    setLastMicrophoneError(media.participant.lastMicrophoneError);
    setLastCameraError(media.participant.lastCameraError);
    setLocalParticipant(media.participant);
  };
  createEffect(() => {
    const listener = observeParticipantMedia(localParticipant()).subscribe(handleUpdate);
    // TODO also listen to permission and metadata etc. events

    onCleanup(() => listener.unsubscribe())
  });

  return {
    isMicrophoneEnabled,
    isScreenShareEnabled,
    isCameraEnabled,
    microphoneTrack,
    cameraTrack,
    lastMicrophoneError,
    lastCameraError,
    localParticipant,
  };
}
