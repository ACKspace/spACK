// @livekit/components-react@2.0.4
// Apache-2.0

import { useMediaTrackBySourceOrName } from '../../signals/useMediaTrackBySourceOrName'
import type { TrackReference } from '@livekit/components-core'
import { log } from '@livekit/components-core'
import { RemoteAudioTrack, RemoteTrackPublication } from 'livekit-client'
import { useEnsureTrackRef } from '../../context'
import type { JSX } from 'solid-js/jsx-runtime'
import { createEffect, onCleanup } from 'solid-js'
import { useMediaDeviceSelect } from '../../signals'

/** @public */
export interface AudioTrackProps extends JSX.AudioHTMLAttributes<HTMLAudioElement> {
  /** The track reference of the track from which the audio is to be rendered. */
  trackRef?: TrackReference

  onSubscriptionStatusChanged?: (subscribed: boolean) => void
  /** Sets the volume of the audio track. By default, the range is between `0.0` and `1.0`. */
  volume?: number
  /**
   * Mutes the audio track if set to `true`.
   * @remarks
   * If set to `true`, the server will stop sending audio track data to the client.
   * @alpha
   */
  muted?: boolean
  /**
   * Whether to enable gain node when volume > 1
   */
  enableBoosting?: boolean
}

/**
 * The AudioTrack component is responsible for rendering participant audio tracks.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * Must be using key in parent tree: (e.g. <Key />, <Show keyed />)
 * (to ensure AudioTrack is unique to each Track and props don't suddenly update to another track!)
 *
 * @example
 * ```tsx
 *   <ParticipantTile>
 *     <AudioTrack trackRef={trackRef} />
 *   </ParticipantTile>
 * ```
 *
 * @see `ParticipantTile` component
 * @public
 */
export function AudioTrack(props: AudioTrackProps) {
  const trackReference = useEnsureTrackRef(props.trackRef)

  let mediaEl: HTMLAudioElement | undefined

  const { elementProps, isSubscribed, track, publication } = useMediaTrackBySourceOrName(
    trackReference,
    {
      element: () => mediaEl,
      props,
    },
  )

  createEffect(() => {
    props.onSubscriptionStatusChanged?.(!!isSubscribed())
  })

  let gainContext: { gainNode: GainNode; audioContext: AudioContext } | undefined
  const { activeDeviceId } = useMediaDeviceSelect({ kind: 'audiooutput' })

  onCleanup(() => {
    if (gainContext) {
      gainContext.gainNode.disconnect()
      gainContext.audioContext.close()
    }
  })

  createEffect(() => {
    const t = track()
    if (t === undefined || props.volume === undefined) {
      return
    }
    if (t instanceof RemoteAudioTrack) {
      if (!props.enableBoosting || props.volume <= 1) {
        t.setVolume(props.volume)

        if (gainContext) {
          gainContext.gainNode.disconnect()
          gainContext.audioContext.close()
          gainContext = undefined
        }
      } else {
        if (gainContext) {
          gainContext.gainNode.gain.value = props.volume
        } else {
          t.setVolume(0)

          const audioContext = new AudioContext()

          if ('setSinkId' in AudioContext.prototype) {
            ;(audioContext as never as { setSinkId: (sinkId: string) => Promise<void> }).setSinkId(
              activeDeviceId(),
            )
          } else {
            console.error(`Browser does not support AudioContext#setSyncId!`)
          }

          const gainNode = audioContext.createGain()

          const source = audioContext.createMediaStreamSource(new MediaStream([t.mediaStreamTrack]))

          gainNode.gain.value = props.volume
          gainNode.connect(audioContext.destination)
          source.connect(gainNode)

          gainContext = {
            audioContext,
            gainNode,
          }
        }
      }
    } else {
      log.warn('Volume can only be set on remote audio tracks.')
    }
  })

  createEffect(() => {
    const pub = publication()
    if (pub === undefined || props.muted === undefined) {
      return
    }
    if (pub instanceof RemoteTrackPublication) {
      pub.setEnabled(!props.muted)
    } else {
      log.warn('Can only call setEnabled on remote track publications.')
    }
  })

  return <audio ref={mediaEl} {...elementProps()} />
}
