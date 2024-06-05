import Store from "electron-store";

export const store = new Store({
  defaults: {
    windowBounds: {
      width: 1280,
      height: 800,
    },
    profiles_folder: "",
    packageDeveloper: false,
  },
});
