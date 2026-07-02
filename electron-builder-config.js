const dotenv = require("dotenv");
dotenv.config();

function productNameByWorkflow() {
  if (process.env.VITE_BUILD_ENV == "nightly") {
    return "grid-editor-nightly";
  } else {
    return "grid-editor";
  }
}

const config = {
  asar: true,
  appId: "intechstudio.grid-editor.app",
  productName: productNameByWorkflow(),
  copyright: "Copyright © Intech Studio Ltd.",
  generateUpdatesFilesForAllChannels: true,
  directories: {
    output: "build/",
    buildResources: "build-assets",
  },
  protocols: [
    {
      name: "grid-editor-protocol",
      schemes: ["grid-editor", "grid-editor-dev"],
    },
  ],
  extraResources: [
    {
      from: "src/renderer/assets/**/*",
      to: "assets",
    },
  ],
  files: ["**/*"],
  win: {
    azureSignOptions: {
      publisherName: "Intech Studio LLC",
      endpoint: "https://weu.codesigning.azure.net/",
      certificateProfileName: "intechstudio",
      codeSigningAccountName: "grid-editor",
    },
    publish: [
      {
        provider: "github",
        owner: "intechstudio",
        repo: "grid-editor",
      },
    ],
    artifactName: "${name}-windows-${version}-x64.${ext}",
    target: ["nsis"],
    icon: "build-assets/icon.png",
  },
  linux: {
    target: "AppImage",
    artifactName: "${name}-linux-${version}.${ext}",
  },
  flatpak: {
    // NOTE: the flatpak app ID is derived from appId
    // ("intechstudio.grid-editor.app"). flatpak-builder accepts it, but if
    // you ever submit to Flathub you will need a compliant reverse-DNS ID
    // (e.g. "studio.intech.GridEditor") and a native manifest instead.
    artifactName: "${name}-linux-${version}-${arch}.${ext}",
    runtime: "org.freedesktop.Platform",
    runtimeVersion: "24.08",
    sdk: "org.freedesktop.Sdk",
    base: "org.electronjs.Electron2.BaseApp",
    baseVersion: "24.08",
    branch: "stable",
    // finishArgs REPLACES electron-builder's defaults, so the full set is
    // listed here on purpose.
    finishArgs: [
      // Windowing / rendering
      "--socket=x11",
      "--socket=wayland",
      "--share=ipc",
      "--device=dri",
      // Sound (Web MIDI on Linux goes through the ALSA sequencer; pulseaudio
      // socket also covers any audio the app or packages produce)
      "--socket=pulseaudio",
      // Networking (auth, profile cloud, firmware/library downloads, ws)
      "--share=network",
      // USB serial access for Grid/Knot (ttyACM enumeration in Chromium's
      // Web Serial needs raw /dev + udev; the USB portal is not sufficient
      // for CDC serial, so --device=all is the required, standard approach)
      "--device=all",
      // UF2 bootloader drives: firmware.ts scans and writes to these mounts
      "--filesystem=/media:rw",
      "--filesystem=/run/media:rw",
      "--filesystem=/mnt:rw",
      // Profiles / user documents
      "--filesystem=home",
      // Desktop integration
      "--talk-name=org.freedesktop.Notifications",
      "--talk-name=org.kde.StatusNotifierWatcher",
    ],
  },
  mac: {
    target: [
      {
        target: "default",
        arch: ["arm64", "x64"],
      },
    ],
    artifactName: "${name}-macos-${version}-${arch}.${ext}",
    icon: "build-assets/icon_mac.png",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "build-assets/entitlements.mac.plist",
    entitlementsInherit: "build-assets/entitlements.mac.plist",
    notarize: true,
  },
  dmg: {
    sign: false,
  },
};

module.exports = config;
