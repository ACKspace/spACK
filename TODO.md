* BUG: repeated subscription (>100) on `playerPublication.publication.on("subscribed", (track) => {`
* FEAT: Keep screen on
* FEAT: audio when lost focus

* volume/panning on audio object https://github.com/livekit-examples/spatial-audio/blob/main/src/controller/useTrackPositions.tsx
* text rendering (pixelated) name/notification, outlined
* custom level/rooms metadata
* better physics  (smooth walking, diagonal speed)
* backend (JWT handler) -> php
* backend authentication
* SolidJS core: chat
* interactive objects

* test/prod deployment
* canvas drawing
  canvas size, center -> block logic
  draw map
  draw objects+players ordered by bottom left->top right (facing north last)
  draw map overlay

* keyboard input (https://support.gather.town/hc/en-us/articles/15910311417620-Keyboard-Shortcuts)
  x: interact
  h: raise hand
  ctrl+shift+A/V: toggle audio/video
  ctlr+o/i/u: available/busy/DND
  z: dance
  f: confetti
  g: ghost mode?
  ctrl+d: walk to desk
  ctrl+l: show location
  esc: close interaction
  ctrl: ghost/pass
  shift: run?
* separate room/presenter audio context tiles

notes:
walkspeed: 6/32 per tick (100ms, 17ms)?
metadata: 64kB
  https://docs.livekit.io/transport/data/state/room-metadata/
  https://docs.livekit.io/transport/data/state/participant-attributes/

Chat: localParticipant().sendText("ASDF"); ?



providers (jukebox, webaudiocontext,animations)

tile properties
  32X32px per tile
  impassable (direction)
  spawn (facing direction)
  portal (target room, coordinate, direction)
  private (identifier)
  spotlight (identifier)


room metadata
  level
    background
    overlay
    bounds
    spawnpoints[]
  objects[]
    image
    activeImage
    action: audio, video, audioStream, videoStream, website, backendCall..?



Mapmaking:
https://gathertown.fandom.com/wiki/Mapmaking_Resources
https://github.com/puifine/mapmaking
  https://github.com/iamthad/gathertown-mapmaking

