/** Object data originating from worker thread
 * broadcasted over the LiveKit channel. */
export type ObjectWorkerData = {
  /** The id (index) of the object. */
  id: number; // LiveKit only
  /** Whether the object became active. */
  active?: boolean;
};

/** Outgoing message posted to the object's worker thread. */
export type Outgoing<T = unknown> = {
  /** The type of outgoing event, currently only `trigger` is supported. */
  type: "trigger";
  /** The payload for the object. */
  payload?: T;
};
