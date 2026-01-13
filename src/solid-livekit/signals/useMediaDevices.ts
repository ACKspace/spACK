// @livekit/components-react@2.9.15
// Apache-2.0

import { createMediaDeviceObserver } from "@livekit/components-core";
import { createMemo } from "solid-js";
import { useObservableState } from "./internal";

/**
 * The `useMediaDevices` hook returns the list of media devices of a given kind.
 *
 * @example
 * ```tsx
 * const videoDevices = useMediaDevices({ kind: 'videoinput' });
 * const audioDevices = useMediaDevices({ kind: 'audioinput' });
 * ```
 * @public
 */
export function useMediaDevices({
  kind,
  onError,
}: {
  kind: MediaDeviceKind;
  onError?: (e: Error) => void;
}) {
  const deviceObserver = createMemo(
    () => createMediaDeviceObserver(kind, onError),
  );

  const devices = useObservableState(deviceObserver(), [] as MediaDeviceInfo[]);
  return devices;
}