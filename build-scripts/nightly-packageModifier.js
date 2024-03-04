// File: build-scripts/updatePackageJson.js

const fs = require("fs");
const path = require("path");

let packageJsonPath = path.join(__dirname, "../package.json");
let packageJson = require(packageJsonPath);

packageJson.version += `-nightly`;

// fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
//   if (err) throw err;
//   console.log("package.json has been updated!");
// });

let branchName = process.env.BRANCH_NAME;
console.log("branchName: ", branchName);

// Update product name in electron-builder.json

let electronBuilderConfigPath = path.join(__dirname, "../electron-builder.js");

let electronBuilderConfig = require(electronBuilderConfigPath);

electronBuilderConfig(` (Nightly) ${branchName}`);

// electronBuilderConfig.config.productName += ` (Nightly) ${branchName}`;

console.log("electronBuilderConfig: ", electronBuilderConfig());

// fs.writeFile(
//   electronBuilderConfigPath,
//   JSON.stringify(electronBuilderConfig, null, 2),
//   (err) => {
//     if (err) throw err;
//     console.log("electron-builder.js has been updated!");
//   }
// );
