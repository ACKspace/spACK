// @livekit/components-react@2.0.4
// Apache-2.0

// @ts-ignore
import type { Observable } from 'rxjs'
import { createEffect, createSignal } from 'solid-js'

/**
 * @internal
 */
export function useObservableState<T>(observable: Observable<T> | undefined, startWith: T) {
  const [state, setState] = createSignal<T>(startWith)
  createEffect(() => {
    // observable state doesn't run in SSR
    if (typeof window === 'undefined' || !observable) return
    const subscription = observable.subscribe(setState)
    return () => subscription.unsubscribe()
  })
  return state
}
