// TODO: find a way to chat without including name

/**
 * Initialize helper
 */
function init() {
  console.info("Worker: Initialized");
}

/** Incoming message
 * @param {Object} data Incoming event data.
 * @param {"trigger"} data.type The type of outgoing event, currently only `trigger` is supported.
 * @param {unknown} data.payload Corresponding payload (boolean for trigger's current state).
 */
function receive(data) {
  // console.log("Worker received:", data);
  send({ active: !data.payload, broadcast: true });
}

/** Outgoing message
 * @param {Object} data Outgoing event data
 * @param {boolean | undefined} data.active Whether the object is active.
 * @param {boolean | undefined} data.broadcast Whether to broadcast the event over the conference.
 */
function send(data) {
  // console.log("Worker sent:", data);
  postMessage(data);
}

addEventListener("message", ({data}) => receive(data));
init();