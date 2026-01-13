import { log, setupLiveKitRoom } from '@livekit/components-core';
import { Room, MediaDeviceFailure, RoomEvent, ConnectionState } from 'livekit-client';
import { type LiveKitRoomProps } from '../components/LiveKitRoom';
import { Accessor, createEffect, createMemo, createSignal, mergeProps, onCleanup } from 'solid-js';

const defaultRoomProps: Partial<LiveKitRoomProps> = {
  connect: true,
  audio: false,
  video: false,
};

/**
 * The `useLiveKitRoom` hook is used to implement the `LiveKitRoom` or your custom implementation of it.
 * It returns a `Room` instance and HTML props that should be applied to the root element of the component.
 *
 * @example
 * ```tsx
 * const { room, htmlProps } = useLiveKitRoom();
 * return <div {...htmlProps}>...</div>;
 * ```
 * @public
 */
export function useLiveKitRoom<T extends HTMLElement>(
  props: LiveKitRoomProps,
): {
  room: Accessor<Room | undefined>;
  htmlProps: Accessor<T>;
} {
  const p = mergeProps(defaultRoomProps, props);
  
  if (p.options && p.room) {
    log.warn(
      'when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead.',
    );
  }

  const [room, setRoom] = createSignal<Room | undefined>();

  // set room if provided or create one when options are provided
  createEffect(() => {
    setRoom(p.room ?? new Room(p.options));
  });

  // determine html properties
  const htmlProps = createMemo<T>(() => {
    const { className } = setupLiveKitRoom();
    // TODO: extract other props
    // return mergeProps({ className: p.className }, { className }) as T;
    return { className } as T;
  });

  // TODO
  // Connect to room events
  createEffect(() => {
    if (!room()) return;
    const onSignalConnected = () => {
      const localP = room()!.localParticipant;

      log.debug('trying to publish local tracks');
      Promise.all([
        localP.setMicrophoneEnabled(!!p.audio, typeof p.audio !== 'boolean' ? p.audio : undefined),
        localP.setCameraEnabled(!!p.video, typeof p.video !== 'boolean' ? p.video : undefined),
        localP.setScreenShareEnabled(!!p.screen, typeof p.screen !== 'boolean' ? p.screen : undefined),
      ]).catch((e) => {
        log.warn(e);
        p.onError?.(e as Error);
      });
    };

    const onMediaDeviceError = (e: Error) => {
      const mediaDeviceFailure = MediaDeviceFailure.getFailure(e);
      p.onMediaDeviceFailure?.(mediaDeviceFailure);
    };
    room()!.on(RoomEvent.SignalConnected, onSignalConnected);
    room()!.on(RoomEvent.MediaDevicesError, onMediaDeviceError);

    onCleanup(() => {
      room()!.off(RoomEvent.SignalConnected, onSignalConnected);
      room()!.off(RoomEvent.MediaDevicesError, onMediaDeviceError);
    });
  });

  // Room connection logic
  createEffect(() => {
    if (!room()) return;

    // How many simulated participants
    if (p.simulateParticipants) {
      room()!.simulateParticipants({
        participants: {
          count: p.simulateParticipants,
        },
        publish: {
          audio: true,
          useRealTracks: true,
        },
      });
      return;
    }
    // Check token
    if (!p.token) {
      log.debug('no token yet');
      return;
    }
    // Check url
    if (!p.serverUrl) {
      log.warn('no livekit url provided');
      p.onError?.(Error('no livekit url provided'));
      return;
    }

    // Connect
    if (p.connect) {
      log.debug('connecting');
      room()!.connect(p.serverUrl, p.token, p.connectOptions).catch((e) => {
        log.warn(e);
        p.onError?.(e as Error);
      });
    } else {
      log.debug('disconnecting because connect is false');
      room()!.disconnect();
    }
  });

  // Room state event logic
  createEffect(() => {
    if (!room()) return;
    const connectionStateChangeListener = (state: ConnectionState) => {
      switch (state) {
        case ConnectionState.Disconnected:
          p.onDisconnected?.();
          break;
        case ConnectionState.Connected:
          p.onConnected?.();
          break;

        default:
          break;
      }
    };
    room()!.on(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    onCleanup(() => {
      room()!.off(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    });
  });

  // Cleanup
  createEffect(() => {
    if (!room()) return;
    onCleanup(() => {
      log.info('disconnecting on onmount');
      room()!.disconnect();
    });
  });

  return { room, htmlProps };
}
