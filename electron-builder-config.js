const dotenv = require("dotenv");
dotenv.config();

function productNameByWorkflow() {
  if (process.env.VITE_BUILD_ENV == "nightly") {
    return `Grid Editor (Nightly) ${process.env.BRANCH_NAME}`;
  } else if (process.env.VITE_BUILD_ENV == "alpha") {
    return `Grid Editor (Alpha) ${process.env.RELEASE_VERSION}`;
  } else {
    return "Grid Editor";
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
    notarize: false,
  },
  dmg: {
    sign: false,
  },
};

module.exports = config;
