// File: build-scripts/updatePackageJson.js

const fs = require("fs");
const path = require("path");

let packageJsonPath = path.join(__dirname, "../package.json");
let packageJson = require(packageJsonPath);

let branchName = process.env.BRANCH_NAME;
let releaseChannel = process.env.RELEASE_CHANNEL;

packageJson.build.productName += `(Nightly) -${branchName}`;
packageJson.version += `-${releaseChannel}`;

fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
  if (err) throw err;
  console.log("package.json has been updated!");
});
