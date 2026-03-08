import { RemoteTrackPublication, RoomEvent, Track } from "livekit-client";
import { batch, Component, createEffect, For, on, Show } from "solid-js";
import { useRoomContext, useTracks } from "../solid-livekit";
import { gameState } from "../model/GameState";
import { useWebAudioContext } from "../providers/webAudio";
import { createStore } from "solid-js/store";
import { Vector2 } from "../model/Vector2";
import { clamp } from "../utils/clamp";
import { Player } from "../model/Player";

/** Store that keeps track of players, track publications and relative position */
type PlayerTracks = Record<string, {
  /** Relative position between remote player and myPlayer */
  relativePosition: Vector2;
  /** Publication to subscribe to or extract media stream */
  publication?: RemoteTrackPublication; // TODO: object "tracks" as well
  /** actual audio stream to play/manipulate */
  mediaStream?: MediaStream;

  /** Context audio source node that contains the spatial controller */
  sourceNode?: MediaStreamAudioSourceNode;

  /** Spatial controller to do the actual sound manipulation on */
  spatialController?: PannerNode | GainNode;
}>;

/**
 * Determine relative position; return large distance if the private area differs.
 * @param self The myPlayer object
 * @param other The other 9remote) player 
 * @returns Vector that contains the relative distance for setting up audio
 */
function determineRelativePosition(self: Player | null, other: Player): Vector2 {
  // Self not initialized or both not in the same (private) area
  if (!self?.targetPos || !other.targetPos || self.private !== other.private)
    return { x: -1000, y: -1000 };

  // Same private area, no offset
  if (self.private && other.private)
    return {x: 0, y: 0};

  // Return real offset
  return {
    x: other.targetPos.x - self.targetPos.x,
    y: other.targetPos.y - self.targetPos.y,
  };
}

export const SpatialAudioController: Component = () => {
  const room = useRoomContext();
  const audioContext = useWebAudioContext();

  const [playerTracks, setPlayerTracks] = createStore<PlayerTracks>({});

  // Gather all available audio tracks
  const myTracks = useTracks([Track.Source.Microphone, Track.Source.Unknown], {
    updateOnlyOn: [
      RoomEvent.TrackPublished,
      RoomEvent.TrackUnpublished,
      RoomEvent.ParticipantConnected,
      RoomEvent.Connected,
    ],
    onlySubscribed: false,
    room: room(),
  });

  createEffect(
    () => {
      // Don't do anything if we're not in position yet.
      if (!gameState.myPlayer?.position) return;

      const userNames = new Set(Object.keys(playerTracks));

      batch(() => {
        gameState.remotePlayers.forEach((player) => {
          userNames.delete(player.username);
          if (!player.targetPos || !gameState.myPlayer?.targetPos) return;

          const relativePosition = determineRelativePosition(gameState.myPlayer, player);
  
          // Set/update relative position (note that other properties will get kept)
          setPlayerTracks(player.username, { relativePosition } );
        });
  
        // Delete users that do not exist
        userNames.forEach((userName) => {
          // TODO: make sure the play() request does not trigger an error
          // @ts-ignore -- undefined removes it from the store.
          setPlayerTracks(userName, undefined );
        });
      });
    }
  );

  // Handle track publication updates
  createEffect(
    () => {
      myTracks().forEach((trackRef) => {
        const identity = trackRef.participant.identity;

        // Only update if the player was found and it's a remote track
        if (!(identity in playerTracks) || !(trackRef.publication instanceof RemoteTrackPublication)) return;

        // Assume we already handled this track
        if (playerTracks[identity].publication?.trackSid === trackRef.publication.trackSid) return;

        // Store the track and subscribe to the media stream
        setPlayerTracks(identity, { publication: trackRef.publication } );

        trackRef.publication.on("subscribed", (track) => {
          if (track.kind !== "audio") return;
          console.info("Subscribed to track publication event");

          setPlayerTracks(identity, { mediaStream: track.mediaStream } );
        });
       
        // Only audio tracks
        if (trackRef.publication.kind !== "audio") return;

        // Initial subscription, if within hearing distance or same private tile
        const relativePosition = playerTracks[identity].relativePosition;
        const hearable = Math.hypot(relativePosition.x, relativePosition.y) <= gameState.earshotRadius;
        trackRef.publication.setSubscribed(hearable);

        // Only audio tracks (NOTE: sometimes non-existent)
        const mediaStream = trackRef.publication.track?.mediaStream?.getAudioTracks().length ? trackRef.publication.track.mediaStream : undefined;
        setPlayerTracks(identity, "mediaStream", mediaStream );
      });
    }
  );

  return <For each={Object.keys(playerTracks)}>{(identity) => {
    let ref!: HTMLAudioElement; // | undefined;

    // Do the gain
    createEffect(() => {
      const relativePosition = playerTracks[identity].relativePosition;
      // Update subscription (earshot radius private tile)
      const hearable = Math.hypot(relativePosition.x, relativePosition.y) <= gameState.earshotRadius;
      playerTracks[identity].publication?.setSubscribed(hearable);

      // TODO: override with private tile logic if needed
      if (playerTracks[identity].spatialController instanceof GainNode) {
        const gain = 1 - clamp(0, Math.hypot(relativePosition.x, relativePosition.y) / gameState.earshotRadius, 1);
        playerTracks[identity].spatialController.gain.setValueAtTime(gain, audioContext.currentTime);
      } else if (playerTracks[identity].spatialController instanceof PannerNode) {
        if (!playerTracks[identity].spatialController.positionX) {
          // For Firefox: use deprecated setPosition()
          playerTracks[identity].spatialController.setPosition(relativePosition.x, 0, relativePosition.y)
        } else {
          playerTracks[identity].spatialController.positionX.setTargetAtTime(relativePosition.x, 0, 0.02);
          playerTracks[identity].spatialController.positionZ.setTargetAtTime(relativePosition.y, 0, 0.02);
        }
      }
    });

    createEffect(
      on(
        () => playerTracks[identity].mediaStream,
        (nextMedia, prevMedia) => {

          // Create corresponding source node
          if (nextMedia) {
            const sourceNode = audioContext.createMediaStreamSource(nextMedia);

            if (false) {

              // MODE 1: Mobile non-spatial setup
              const gain = audioContext.createGain();
              gain.gain.setValueAtTime(0, 0); // Muted initially
              sourceNode
                .connect(gain)
                .connect(audioContext.destination);
              setPlayerTracks(identity, { sourceNode, spatialController: gain });

            } else {
              // MODE 2: Panning sound
              const panner = audioContext.createPanner();
              panner.coneOuterAngle = 360;
              panner.coneInnerAngle = 360;
              // set far away initially so we don't hear it at full volume
              panner.positionX.setValueAtTime(0, 0); // TODO
              panner.positionY.setValueAtTime(0, 0);
              panner.positionZ.setValueAtTime(0, 0);
              panner.distanceModel = "exponential";
              panner.coneOuterGain = 1;
              panner.refDistance = 3;
              panner.maxDistance = 9;
              panner.rolloffFactor = 2;
              sourceNode
                .connect(panner)
                .connect(audioContext.destination);
              setPlayerTracks(identity, { sourceNode, spatialController: panner });
            }

          }

          // Chromium specific: the stream needs to be attached to a node or it won't route
          ref.srcObject = nextMedia ?? null;
          ref.muted = true;
          ref.play();
        }
      )
    )

    return <div>
      <audio ref={ref}/>
      {/* TODO: remove */}
      <Show when={gameState.debugMode}>
        <div style={{position:"absolute", bottom:0, left:0, background: "rgba(255,255,255,0.2)" }}>
          {identity}:{playerTracks[identity].relativePosition.x},{playerTracks[identity].relativePosition.y}
        </div>
      </Show>
    </div>
  }}</For>
};

export default SpatialAudioController;
