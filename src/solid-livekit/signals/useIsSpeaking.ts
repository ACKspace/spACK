// @livekit/components-react@2.0.4
// Apache-2.0

import { createIsSpeakingObserver } from '@livekit/components-core'
import { useEnsureParticipant } from '../context'
import { useObservableState } from './internal'
import { createMemo } from 'solid-js'

import type { Participant } from 'livekit-client'
import type { Observable } from 'rxjs'

/**
 * The `useIsSpeaking` hook returns a `boolean` that indicates if the participant is speaking or not.
 * @example
 * ```tsx
 * const isSpeaking = useIsSpeaking(participant);
 * ```
 * @public
 */
export function useIsSpeaking(participant?: Participant) {
  const p = useEnsureParticipant(participant)
  const observable = createMemo(() => createIsSpeakingObserver(p), [p])
  const isSpeaking = useObservableState(observable() as unknown as Observable<boolean>, p.isSpeaking)

  return isSpeaking
}
