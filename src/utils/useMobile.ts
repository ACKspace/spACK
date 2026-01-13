
export const useMobile = () => {
  if (typeof navigator === "undefined") return false;
  // @ts-ignore -- experimental feature
  if (navigator.userAgentData?.mobile) return true; // Experimental
  if (window.innerWidth <= 768) return true; // Window width
  if (window.matchMedia("(pointer: coarse)").matches) return true; // Touch
  if (/Mobi|Android/i.test(navigator.userAgent)) return true; // Mobile user agent
  if (navigator.maxTouchPoints > 1) return true; // Touch device
  return false;
};
