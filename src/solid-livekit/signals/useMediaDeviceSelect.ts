// @livekit/components-react@2.9.15
// Apache-2.0

import { createMediaDeviceObserver, setupDeviceSelector } from '@livekit/components-core'
import { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client'
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'
import { useObservableState } from './internal'
import { useMaybeRoomContext } from '../context'

/** @public */
export interface UseMediaDeviceSelectProps {
  kind: MediaDeviceKind
  room?: Room
  track?: LocalAudioTrack | LocalVideoTrack
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link MediaDeviceMenu}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean
  /**
   * this callback gets called if an error is thrown when failing to select a device and also if a user
   * denied permissions, eventhough the `requestPermissions` option is set to `true`.
   * Most commonly this will emit a MediaDeviceError
   */
  onError?: (e: Error) => void
}

/**
 * The `useMediaDeviceSelect` hook is used to implement the `MediaDeviceSelect` component and
 * returns o.a. the list of devices of a given kind (audioinput or videoinput), the currently active device
 * and a function to set the the active device.
 *
 * @example
 * ```tsx
 * const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({kind: 'audioinput'});
 * ```
 * @public
 */
export function useMediaDeviceSelect({
  kind,
  room,
  track,
  requestPermissions,
  onError,
}: UseMediaDeviceSelectProps) {
  const roomContext = useMaybeRoomContext()
  const roomFallback = createMemo(() => room ?? roomContext?.() ?? new Room())

  // List of all devices.
  const deviceObserver = createMemo(() =>
    createMediaDeviceObserver(kind, onError, requestPermissions),
  )

  const devices = useObservableState(deviceObserver(), [] as MediaDeviceInfo[])

  // Active device management.
  const [currentDeviceId, setCurrentDeviceId] = createSignal(
    roomFallback()?.getActiveDevice(kind) ?? 'default',
  )

  const deviceSelector = createMemo(() => setupDeviceSelector(kind, roomFallback()))

  createEffect(
    on(
      () => deviceSelector(),
      ({ activeDeviceObservable }) => {
        const listener = activeDeviceObservable.subscribe(deviceId => {
          if (!deviceId) {
            return
          }
          console.info('setCurrentDeviceId', deviceId)
          setCurrentDeviceId(deviceId)
        })

        onCleanup(() => {
          listener?.unsubscribe()
        })
      },
    ),
  )

  return {
    devices,
    className: () => deviceSelector().className,
    activeDeviceId: currentDeviceId,
    setActiveMediaDevice: (
      ...args: Parameters<ReturnType<typeof deviceSelector>['setActiveMediaDevice']>
    ) => deviceSelector().setActiveMediaDevice(...args),
  }
}
