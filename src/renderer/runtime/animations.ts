import { writable } from "svelte/store";

export const reduced_motion_store = create_reduced_motion_store();

function create_reduced_motion_store() {
  // Grab the prefers reduced media query.
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = !mediaQuery || mediaQuery.matches; //true if reduced
  const store = writable(reduced);

  // Ads an event listener to check for changes in the media query's value.
  mediaQuery.addEventListener("change", () => {
    store.set(mediaQuery.matches);
  });
  return store;
}

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
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
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
