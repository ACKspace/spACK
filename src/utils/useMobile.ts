import { createSignal } from "solid-js";

const [touch, setTouch] = createSignal(false);

export const useMobile = () => {
  if (typeof navigator === "undefined") return false;
  const listenOnce = (event: PointerEvent) => {
    if (event.pointerType === "touch") setTouch(true);
    document.removeEventListener("pointerdown", listenOnce);
  };

  // We might want to listen to touchstart initially since hybrid devices don't expose touch visibly.
  if (!touch()) document.addEventListener("pointerdown", listenOnce);

  // @ts-ignore -- experimental feature
  if (navigator.userAgentData?.mobile) return true; // Experimental
  if (window.innerWidth <= 768) return true; // Window width
  if (window.matchMedia("(pointer: coarse)").matches) return true; // Touch
  if (/Mobi|Android/i.test(navigator.userAgent)) return true; // Mobile user agent
  if (navigator.maxTouchPoints > 1) return true; // Touch device
  return touch();
};
