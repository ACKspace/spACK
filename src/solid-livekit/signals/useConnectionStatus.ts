// @livekit/components-react@2.0.4
// Apache-2.0

import { connectionStateObserver } from '@livekit/components-core'
import { useEnsureRoom } from '../context'
import { useObservableState } from './internal'
import { createMemo } from 'solid-js'

import type { ConnectionState, Room } from 'livekit-client'
import type { Observable } from 'rxjs'

/**
 * The `useConnectionState` hook allows you to simply implement your own `ConnectionState` component.
 *
 * @example
 * ```tsx
 * const connectionState = useConnectionState(room);
 * ```
 * @public
 */
export function useConnectionState(room?: Room) {
  // passed room takes precedence, if not supplied get current room context
  const r = useEnsureRoom(room)
  const observable = createMemo(() => connectionStateObserver(r()))
  const connectionState = useObservableState(observable() as unknown as Observable<ConnectionState>, r().state)
  return connectionState
}
