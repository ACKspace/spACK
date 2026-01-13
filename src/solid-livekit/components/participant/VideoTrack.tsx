// @livekit/components-react@2.0.4
// Apache-2.0

import { RemoteTrackPublication } from 'livekit-client'
import { useMediaTrackBySourceOrName } from '../../signals/useMediaTrackBySourceOrName'
import type { ParticipantClickEvent, TrackReference } from '@livekit/components-core'
import { useEnsureTrackRef } from '../../context'
import { createEffect, createSignal } from 'solid-js'
import { createVisibilityObserver } from '@solid-primitives/intersection-observer'
import type { JSX } from 'solid-js/jsx-runtime'
import { debounce } from '@solid-primitives/scheduled'

/** @public */
export interface VideoTrackProps extends JSX.VideoHTMLAttributes<HTMLVideoElement> {
  /** The track reference of the track to render. */
  trackRef?: TrackReference
  onTrackClick?: (evt: ParticipantClickEvent) => void
  onSubscriptionStatusChanged?: (subscribed: boolean) => void
  manageSubscription?: boolean
}

/**
 * The `VideoTrack` component is responsible for rendering participant video tracks like `camera` and `screen_share`.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 * <VideoTrack trackRef={trackRef} />
 * ```
 * @see {@link @livekit/components-react#ParticipantTile | ParticipantTile}
 * @public
 */
export function VideoTrack({
  onTrackClick,
  onClick,
  onSubscriptionStatusChanged,
  trackRef,
  manageSubscription,
  ...props
}: VideoTrackProps) {
  const trackReference = useEnsureTrackRef(trackRef)

  let mediaEl: HTMLVideoElement | undefined

  const useVisibilityObserver = createVisibilityObserver({ threshold: 0.8 })
  const visible = useVisibilityObserver(() => mediaEl)

  const [maintainedVisibility, setMaintainedVisibility] = createSignal<boolean>()
  const updateVisibility = debounce((vis: boolean) => setMaintainedVisibility(vis), 3000)
  createEffect(() => updateVisibility(visible()))

  createEffect(() => {
    if (
      manageSubscription &&
      trackReference.publication instanceof RemoteTrackPublication &&
      maintainedVisibility() === false &&
      visible() === false
    ) {
      trackReference.publication.setSubscribed(false)
    }
  })

  createEffect(() => {
    if (
      manageSubscription &&
      trackReference.publication instanceof RemoteTrackPublication &&
      visible()
    ) {
      trackReference.publication.setSubscribed(true)
    }
  })

  const { elementProps, publication, isSubscribed } = useMediaTrackBySourceOrName(trackReference, {
    element: () => mediaEl,
    // @ts-expect-error ???
    props,
  })

  createEffect(() => {
    onSubscriptionStatusChanged?.(!!isSubscribed())
  })

  const clickHandler = (evt: MouseEvent) => {
    ;(onClick as (evt: MouseEvent) => void)?.(evt)
    onTrackClick?.({ participant: trackReference?.participant, track: publication() })
  }

  return <video ref={mediaEl} {...elementProps} muted={true} onClick={clickHandler}></video>
}
