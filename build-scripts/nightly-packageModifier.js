// File: build-scripts/updatePackageJson.js

const fs = require("fs");
const path = require("path");

let packageJsonPath = path.join(__dirname, "../package.json");
let packageJson = require(packageJsonPath);

let branchName = process.env.BRANCH_NAME;
console.log("branchName: ", branchName);

packageJson.build.productName += ` (Nightly) ${branchName}`;
packageJson.version += `-nightly`;

fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
  if (err) throw err;
  console.log("package.json has been updated!");
});
