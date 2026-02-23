// TODO: find a way to chat without including name

/**
 * Initialize helper
 */
function init() {
  console.info("Worker: SpaceState Initialized");
  setInterval(async () => {
    try {
      const active = (await (await fetch("https://ackspace.nl/spaceAPI/")).json()).state.open;
      console.log("Open:", active);
      send({ active });
    } catch {
      console.warn("Fetch space state failed");
      send({ active: false });
    }
  }, 9000 + Math.random() * 2000);
}

/** Incoming message
 * @param {Object} data Incoming event data.
 * @param {"trigger"} data.type The type of outgoing event, currently only `trigger` is supported.
 * @param {unknown} data.payload Corresponding payload (boolean for trigger's current state).
 */
function receive(data) {
  console.log("Worker received:", data);
}

/** Outgoing message
 * @param {Object} data Outgoing event data
 * @param {boolean | undefined} data.active Whether the object is active.
 * @param {boolean | undefined} data.broadcast Whether to broadcast the event over the conference.
 */
function send(data) {
  postMessage(data);
}

addEventListener("message", ({data}) => receive(data));
init();