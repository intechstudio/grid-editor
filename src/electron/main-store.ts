import Store from "electron-store";

export const store = new Store({
  defaults: {
    windowBounds: {
      width: 1366,
      height: 768,
    },
    profiles_folder: "",
  },
});
