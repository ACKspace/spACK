// @livekit/components-react@2.0.4
// Apache-2.0

import { encryptionStatusObservable } from '@livekit/components-core'
import { useEnsureParticipant, useEnsureRoom } from '../context'
import { useObservableState } from './internal'
import { createMemo } from 'solid-js'

import { LocalParticipant, type Participant } from 'livekit-client'
import type { Observable } from 'rxjs'

/**
 * @alpha
 */
export function useIsEncrypted(participant?: Participant) {
  const p = useEnsureParticipant(participant)
  const room = useEnsureRoom()

  const observer = createMemo(() => encryptionStatusObservable(room(), p))
  const isEncrypted = useObservableState(
    observer() as unknown as Observable<boolean>,
    p instanceof LocalParticipant ? p.isE2EEEnabled : p.isEncrypted,
  )
  return isEncrypted
}
