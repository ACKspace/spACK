import { participantInfoObserver } from '@livekit/components-core';
import type { Participant } from 'livekit-client';
import { useEnsureParticipant } from '../solid-livekit';
import { useObservableState } from '../solid-livekit/signals/internal';
import { createMemo } from 'solid-js';
// import { useEnsureParticipant } from '../context';
// import { useObservableState } from './internal';

/**
 * The `useParticipantInfo` hook returns the identity, name, and metadata of a given participant.
 * It requires a `Participant` object passed as property or via the `ParticipantContext`.
 *
 * @example
 * ```tsx
 * const { identity, name, metadata } = useParticipantInfo({ participant });
 * ```
 * @public
 */
export interface UseParticipantInfoOptions {
  participant?: Participant;
}

/** @public */
export function useParticipantInfo(props: UseParticipantInfoOptions = {}) {
  const p = useEnsureParticipant(props.participant);
  const infoObserver = createMemo(() => participantInfoObserver(p), [p]);
  const participantInfo = useObservableState(infoObserver(), {
    name: p.name,
    identity: p.identity,
    metadata: p.metadata,
  });

  return participantInfo;
}
