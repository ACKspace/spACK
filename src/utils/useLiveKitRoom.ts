import { Room, MediaDeviceFailure, RoomEvent, ConnectionState, ParticipantEvent } from 'livekit-client';
import { type LiveKitRoomProps } from '../components/LiveKitRoom';
import { Accessor, createEffect, createMemo, createSignal, mergeProps, onCleanup } from 'solid-js';


const defaultRoomProps: Partial<LiveKitRoomProps> = {
  connect: true,
  audio: false,
  video: false,
};

/**
 * Use LiveKit room helper
 * @param props LiveKit room props
 * @returns 
 */
export function useLiveKitRoom(
  props: LiveKitRoomProps,
): {
  room: Accessor<Room>;
  connected: Accessor<boolean>;
} {
  const p = mergeProps(defaultRoomProps, props);

  if (p.options && p.room) {
    console.warn(
      'when using a manually created room, the options object will be ignored. set the desired options directly when creating the room instead.',
    );
  }

  const room = createMemo<Room>(() => p.room ?? new Room(p.options));
  const [connected, setConnected] = createSignal(false);
  // TODO
  // Connect to room events
  createEffect(() => {
    const onSignalConnected = () => {
      const localP = room().localParticipant;

      console.debug('trying to publish local tracks');
      Promise.all([
        localP.setMicrophoneEnabled(!!p.audio, typeof p.audio !== 'boolean' ? p.audio : undefined),
        localP.setCameraEnabled(!!p.video, typeof p.video !== 'boolean' ? p.video : undefined),
        localP.setScreenShareEnabled(!!p.screen, typeof p.screen !== 'boolean' ? p.screen : undefined),
      ]).catch((e) => {
        console.warn(e);
        p.onError?.(e as Error);
      });
    };

    const onMediaDeviceError = (e: Error) => {
      const mediaDeviceFailure = MediaDeviceFailure.getFailure(e);
      p.onMediaDeviceFailure?.(mediaDeviceFailure);
    };
    room().on(RoomEvent.SignalConnected, onSignalConnected);
    room().on(RoomEvent.MediaDevicesError, onMediaDeviceError);

    onCleanup(() => {
      room().off(RoomEvent.SignalConnected, onSignalConnected);
      room().off(RoomEvent.MediaDevicesError, onMediaDeviceError);
    });
  });

  // Room connection logic
  createEffect(() => {
    // How many simulated participants
    if (p.simulateParticipants) {
      room().simulateParticipants({
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
      console.debug('no token yet');
      return;
    }
    // Check url
    if (!p.serverUrl) {
      console.warn('no livekit url provided');
      p.onError?.(Error('no livekit url provided'));
      return;
    }

    // Connect
    if (p.connect) {
      console.debug('connecting');
      room().connect(p.serverUrl, p.token, p.connectOptions).catch((e) => {
        console.warn(e);
        p.onError?.(e as Error);
      });
    } else {
      console.debug('disconnecting because connect is false');
      room().disconnect();
    }
  });

  // Room state event logic
  createEffect(() => {
    const connectionStateChangeListener = (state: ConnectionState) => {
      switch (state) {
        case ConnectionState.Disconnected:
          p.onDisconnected?.();
          setConnected(false);
          break;
        case ConnectionState.Connected:
          p.onConnected?.();
          break;

        default:
          break;
      }
    };

    const setConnectedTrue = () => setConnected(true)
    room().on(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
    room().localParticipant.on(ParticipantEvent.Active, setConnectedTrue);

    onCleanup(() => {
      room().off(RoomEvent.ConnectionStateChanged, connectionStateChangeListener);
      room().localParticipant.off(ParticipantEvent.Active, setConnectedTrue);
    });
  });

  return { room, connected };
}
