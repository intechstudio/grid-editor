require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { notarize } = require("@electron/notarize");
const builder = require("../electron-builder");

module.exports = async function (params) {
  // Only notarize the app if building for macOS and the NOTARIZE environment
  // variable is present.
  if (!process.env.NOTARIZE || process.platform !== "darwin") {
    return;
  }

  console.log("afterSign hook triggered", params);

  // This should match the appId from electron-builder. It reads from
  // package.json so you won't have to maintain two separate configurations.
  let appId = builder.appId;
  if (!appId) {
    console.warn("appId is missing from build configuration 'package.json'");
  }

  let appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`
  );
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    await notarize({
      tool: 'notarytool',
      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    });
  } catch (error) {
    console.warn("NOTARY ERROR " + error);
  }

  console.log(`Done notarizing ${appId}`);
};
