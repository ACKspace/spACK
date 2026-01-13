import { createContext, useContext } from 'solid-js'

export const WebAudioContext = createContext<AudioContext | undefined>(
  undefined
);

export function useWebAudioContext() {
  const ctx = useContext(WebAudioContext);
  if (!ctx) {
    throw "useWebAudio must be used within a WebAudioProvider";
  }
  return ctx;
}
