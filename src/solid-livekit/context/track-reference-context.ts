// @livekit/components-react@2.0.4
// Apache-2.0

import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { createContext, useContext } from 'solid-js'

/**
 * This context provides a `TrackReferenceOrPlaceholder` to all child components.
 * @public
 */
export const TrackRefContext = createContext<TrackReferenceOrPlaceholder | undefined>(undefined)

/**
 * Ensures that a track reference is provided via context.
 * If not inside a `TrackRefContext`, an error is thrown.
 * @public
 */
export function useTrackRefContext() {
  const trackReference = useContext(TrackRefContext)
  if (!trackReference) {
    throw Error('tried to access track context outside of track context provider')
  }
  return trackReference
}

/**
 * Returns a track reference from the `TrackRefContext` if it exists, otherwise `undefined`.
 * @public
 */
export function useMaybeTrackRefContext() {
  return useContext(TrackRefContext)
}

/**
 * Ensures that a track reference is provided, either via context or explicitly as a parameter.
 * If not inside a `TrackRefContext` and no track reference is provided, an error is thrown.
 * @public
 */
export function useEnsureTrackRef(trackRef?: TrackReferenceOrPlaceholder) {
  const context = useMaybeTrackRefContext()
  const ref = trackRef ?? context
  if (!ref) {
    throw new Error(
      'No TrackRef, make sure you are inside a TrackRefContext or pass the TrackRef explicitly',
    )
  }
  return ref
}
