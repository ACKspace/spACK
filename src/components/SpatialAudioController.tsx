import { RemoteTrackPublication, RoomEvent, Track } from "livekit-client";
import { Component, createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useRoomContext, useTracks } from "../solid-livekit";
import { useRemoteParticipants } from "../utils/useRemoteParticipants";
import { gameState } from "../model/GameState";

export const SpatialAudioController: Component = () => {
  const room = useRoomContext();

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

  // From tracks/trackReference to trackPublication (and position for subscription handling)
  const playerTrackPublications = createMemo(() => {
    return gameState.remotePlayers.map((player) => {
      const trackReference = myTracks().find((track) => track.participant.identity === player.username);
      if (!trackReference || !(trackReference.publication instanceof RemoteTrackPublication)) return undefined;

      return {
        publication: trackReference.publication,
        position: player.position,
        username: player.username, // Debug
      };
    });
  });

  // Update subscription and only return hearable (subscribed) tracks
  const hearablePlayerPublications = createMemo(() => {
    return playerTrackPublications().map((playerPublication) => {
      const [mediaStream, setMediaStream] = createSignal<MediaStream>();

      if (!playerPublication) return undefined;

      // TODO: once? Store object for all of this?
      playerPublication.publication.on("subscribed", (track) => {
        if (track.kind !== "audio") return;
        console.log("Subscribed to track publication event");
        setMediaStream(track.mediaStream);
      });
      
      // Only audio tracks
      if (playerPublication?.publication.kind !== "audio") return;

      const hearable = true;
      // TODO: determine volume and panning

      playerPublication.publication.setSubscribed(hearable);


      // Only audio tracks (NOTE: sometimes non-existent)
      if (!playerPublication?.publication.track?.mediaStream?.getAudioTracks().length) return undefined;

      setMediaStream(playerPublication.publication.track.mediaStream);

      if (!hearable) return undefined;
      return {
        mediaStream: mediaStream(),
        position: playerPublication.position,
        relativePosition: null,
        username: playerPublication.username,
      };
    })
  });

  return <For each={hearablePlayerPublications()} >{(playerPublication,i) => {
    let ref: HTMLAudioElement | undefined;
    createEffect(() => {
      if (!ref) return;
      ref.srcObject = playerPublication?.mediaStream ?? null;
      if (playerPublication?.mediaStream) ref.play();
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
