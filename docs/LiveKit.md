# LiveKit

The LiveKit service is an all in one process that manages the conference rooms, participants and their corresponding exchange of media.
For best performance and compatibility, it needs to run on a public IP address, although local offline development is possible within its network.

It is managed with a corresponding JSON Web Token (JWT), handed out by the token service.

The WebApp will delegate these request provided that it has a valid token.


## RoomService

TODO; [see Room service API](https://docs.livekit.io/reference/other/roomservice-api/)

Calls require a `Bearer` authorization header containing the JSON Web Token (JWT) as provided by the token service.

## WebRTC

Communication is done over WebRTC and al the details are handled by LiveKit's frontend helper libraries: `@livekit/components-core` (some types and observers) and `livekit-client` (actual Room, some types and enums) with a small wrapper called `solid-livekit`.
