import { RemoteTrackPublication, RoomEvent, Track } from "livekit-client";
import { Component, createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from "solid-js";
import { TrackReference, useRoomContext, useTracks } from "../solid-livekit";
import { gameState } from "../model/GameState";
import { useMobile } from "../utils/useMobile";
import { useWebAudioContext } from "../providers/webAudio";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { Vector2 } from "../model/Vector2";
import { Player } from "../model/Player";
import { clamp } from "../utils/clamp";

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

export const SpatialAudioController: Component = () => {
  const room = useRoomContext();
  const mobile = useMobile();
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

      gameState.remotePlayers.forEach((player) => {
        const relativePosition: Vector2 = {
          x: player.position.x - gameState.myPlayer!.position.x,
          y: player.position.y - gameState.myPlayer!.position.y,
        };

        // Set/update relative position (note that other properties will get kept)
        setPlayerTracks(player.username, { relativePosition } );
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
          console.log("Subscribed to track publication event");

          setPlayerTracks(identity, { mediaStream: track.mediaStream } );
        });
       
        // Only audio tracks
        if (trackRef.publication.kind !== "audio") return;

        const hearable = true;
        // TODO: determine volume and panning

        trackRef.publication.setSubscribed(hearable);


        // Only audio tracks (NOTE: sometimes non-existent)
        if (!trackRef.publication.track?.mediaStream?.getAudioTracks().length) return undefined;

        setPlayerTracks(identity, { mediaStream: trackRef.publication.track.mediaStream } );

        // if (!hearable) return undefined;

      });
    }
  );

  return <For each={Object.keys(playerTracks)}>{(identity) => {
    let ref!: HTMLAudioElement; // | undefined;

    // Do the gain
    createEffect(() => {
      const relativePosition = playerTracks[identity].relativePosition;

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

            console.log("audio tracks", nextMedia.getAudioTracks().length);
            console.log("enabled", nextMedia.getAudioTracks()[0].enabled);
            console.log("ready", nextMedia.getAudioTracks()[0].readyState);

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
      {identity}:{playerTracks[identity].relativePosition.x},{playerTracks[identity].relativePosition.y}
    </div>
  }}</For>

  return <For each={hearablePlayerPublications()} >{(playerPublication,i) => {
    let ref: HTMLAudioElement | undefined;
    createEffect(() => {
      if (!ref) return;

      // DEBUG spatial audio
      if (false) {
        const [spatialController, setSpatialController] = createSignal<PannerNode | GainNode>();

        if (playerPublication?.mediaStream && audioContext) {
          const sourceNode = createMemo(() => 
            audioContext.createMediaStreamSource(playerPublication.mediaStream!)
          );

          if (mobile) {
            const gain = audioContext.createGain();
            gain.gain.setValueAtTime(0, 0);
            sourceNode()
              .connect(gain)
              .connect(audioContext.destination);
            setSpatialController(gain);
          } else {
            const panner = audioContext.createPanner();
            panner.coneOuterAngle = 360;
            panner.coneInnerAngle = 360;
            panner.positionX.setValueAtTime(playerPublication.relativePosition.x, 0); // set far away initially so we don't hear it at full volume
            panner.positionY.setValueAtTime(playerPublication.relativePosition.y, 0);
            panner.positionZ.setValueAtTime(0, 0);
            panner.distanceModel = "exponential";
            panner.coneOuterGain = 1;
            panner.refDistance = 3;
            panner.maxDistance = 15;
            panner.rolloffFactor = 2;
            sourceNode()
              .connect(panner)
              .connect(audioContext.destination);
            ref.srcObject = playerPublication.mediaStream;
            ref.play();
            setSpatialController(panner);
          }
        }
      } else {
        ref.srcObject = playerPublication?.mediaStream ?? null;
        if (playerPublication?.mediaStream) ref.play();
      }
    });

    return <>
      pub{i()}
      {playerPublication?.username}
      <Show when={playerPublication}>
        <audio ref={ref}/>
        {playerPublication?.username}
      </Show>
      </>
    }}</For>
};

export default SpatialAudioController;
