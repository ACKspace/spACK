<?php
define("API_KEY", getenv("LIVEKIT_API_KEY") ?: "devkey");
define("PASSWORD", getenv("LIVEKIT_PASSWORD") ?: "secret");
// Browser-facing WebSocket URL (returned to client as ws_url)
define("URL", getenv("LIVEKIT_URL") ?: "https://pauper.tel/livekit/");
// Internal URL for server-side Twirp API calls (can differ from URL in Docker)
define("INTERNAL_URL", getenv("LIVEKIT_INTERNAL_URL") ?: URL);
