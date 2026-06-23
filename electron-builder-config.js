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
    notarize: true,
  },
  dmg: {
    sign: false,
  },
};

module.exports = config;
