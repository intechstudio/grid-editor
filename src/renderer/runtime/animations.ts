import { readable } from "svelte/store";

export const reduced_motion_store = readable(false, (set) => {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  set(Boolean(mediaQuery?.matches));

  const handleChange = (event: MediaQueryListEvent) => {
    set(event.matches);
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
});

export function setDocumentAnimationsEnabled(value: boolean) {
  if (value) {
    enableAnimation();
  } else {
    disableAnimation();
  }
}

function disableAnimation() {
  const css = `
        * {
          animation-duration: 0ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0ms !important;
          animation-delay: 0ms !important;
        }
      `;
  const existingStyleElement = document.getElementById("custom-global-style");
  if (!existingStyleElement) {
    const styleElement = document.createElement("style");
    styleElement.textContent = css;
    styleElement.id = "custom-global-style";
    document.head.appendChild(styleElement);
  }
}

function enableAnimation() {
  const existingStyleElement = document.getElementById("custom-global-style");
  if (existingStyleElement) {
    existingStyleElement.remove();
  }
}
