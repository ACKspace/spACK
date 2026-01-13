* canvas drawing
  canvas size, center -> block logic
  draw map
  draw objects+players ordered by bottom left->top right
  draw map overlay

* keyboard input (https://support.gather.town/hc/en-us/articles/15910311417620-Keyboard-Shortcuts)
  wsad, arrows: direction
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
* audio context/magic
* physics (smooth walking)
* animations


* outlined pixelated font


notes:
walkspeed: 6/32 per tick (100ms, 17ms)?
metadata: 64kB
  https://docs.livekit.io/transport/data/state/room-metadata/
  https://docs.livekit.io/transport/data/state/participant-attributes/

Chat: localParticipant().sendText("ASDF"); ?


separate room/audio context tiles

providers (jukebox, webaudiocontext,animations)

tile properties
  32X32px per tile
  impassable (direction)
  spawn (facing direction)
  portal (target room, coordinate, direction)
  private (identifier)
  spotlight (identifier)

interactive objects

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


          {/* <Group
          transform={{
            // position: { x: 100, y: 100 }
          }}
          style={{
            background: "orange"
          }}
          clip={() => <>
              <Rectangle
                transform={{
                  position: { x: 5, y: 10 }
                }}
                style={{
                  dimensions: {width: 50, height: 100},
                  fill: "green"
                }}
              />          
          </>}
          // clip={() => (
          //   <>
          //     <Rectangle
          //       transform={{
          //         position: { x: 10, y: 10 }
          //       }}
          //       style={{
          //         dimensions:{ width: 100, height: 50 }
          //       }}
          //       // 
          //       // 
          //     />
          //     <Rectangle
          //       transform={{
          //         position: { x: 10, y: 10 }
          //       }}
          //       style={{
          //         dimensions: {width: 50, height: 100},
          //         fill: "red"
          //       }}
          //     />
          //   </>
          // )}
        >
          <Rectangle
            transform={{
              position: { x: 10, y: 10 }
            }}
            style={{
              dimensions: {width: 50, height: 100},
              fill: "red"
            }}
          />
        </Group> */}
