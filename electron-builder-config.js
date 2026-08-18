const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
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
  // Use the modern AppImage toolset/runtime (electron-builder "1.0.2",
  // runtime 20251108) instead of the legacy default ("0.0.0").
  //
  // The legacy runtime dynamically links libfuse.so.2 to self-mount its
  // squashfs. Manjaro/Arch and current Ubuntu (23.10 / 24.04+) no longer
  // ship libfuse2 by default, so the mount fails and the runtime dies with
  // "execv error: Transport endpoint is not connected" (ENOTCONN) or
  // "execv error: Input/output error" (EIO) before the app ever starts.
  // The 1.0.2 toolset bundles the FUSE libraries inside the AppImage
  // (usr/lib), removing the host libfuse2 dependency. Flatpak was never
  // affected because it doesn't use the AppImage/FUSE runtime.
  toolsets: {
    appimage: "1.0.2",
  },
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
    {
      from: "build-assets/lua-annotations",
      to: "lua-annotations",
    },
    ...fs
      .readdirSync(path.join(__dirname, "build-assets"))
      .filter(
        (d) =>
          d.startsWith("lua-language-server-") &&
          fs.statSync(path.join(__dirname, "build-assets", d)).isDirectory(),
      )
      .map((dir) => ({ from: `build-assets/${dir}`, to: dir })),
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
    // AppImage stays the default target so `npm run export` behaves exactly
    // as before. The flatpak target is selected explicitly via
    // `electron-builder --linux flatpak` (see e:builder:flatpak script),
    // so it never runs implicitly on machines without flatpak-builder.
    target: "AppImage",
    // ${arch} is required: the matrix builds AppImages on both x64
    // (ubuntu-22.04) and arm64 (ubuntu-22.04-arm) runners, and the release
    // publish step downloads every artifact into one directory with
    // merge-multiple. Without the arch token both builds share a filename
    // and silently overwrite each other, so users can receive the wrong-arch
    // binary. The per-arch update channels (latest-linux.yml /
    // latest-linux-arm64.yml) also each reference their own file this way.
    artifactName: "${name}-linux-${version}-${arch}.${ext}",
    category: "Audio",
    synopsis: "Editor software for Intech Studio Grid controllers",
    desktop: {
      entry: {
        StartupWMClass: productNameByWorkflow(),
      },
    },
  },
  flatpak: {
    // NOTE: the flatpak app ID is derived from appId
    // ("intechstudio.grid-editor.app"). flatpak-builder accepts it, but if
    // you ever submit to Flathub you will need a compliant reverse-DNS ID
    // (e.g. "studio.intech.GridEditor") and a native manifest instead.
    artifactName: "${name}-linux-${version}-${arch}.${ext}",
    runtime: "org.freedesktop.Platform",
    runtimeVersion: "25.08",
    sdk: "org.freedesktop.Sdk",
    base: "org.electronjs.Electron2.BaseApp",
    baseVersion: "25.08",
    branch: "stable",
    // finishArgs REPLACES electron-builder's defaults, so the full set is
    // listed here on purpose.
    finishArgs: [
      // Windowing / rendering
      "--socket=x11",
      "--socket=wayland",
      "--share=ipc",
      "--device=dri",
      // D-Bus session bus: required by zypak-helper (the Electron zygote wrapper
      // in Electron2.BaseApp) to negotiate the sandbox strategy. Without this,
      // zypak aborts on systems where dbus is built without X11 autolaunch
      // (e.g. Debian/Ubuntu >= 23.04). Must be listed before other sockets.
      // Reported by @benblaise-intech
      "--socket=session-bus",
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
