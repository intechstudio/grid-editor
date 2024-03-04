// File: build-scripts/updatePackageJson.js

const fs = require("fs");
const path = require("path");

// Update package version in package.json

let packageJsonPath = path.join(__dirname, "../package.json");
let packageJson = require(packageJsonPath);

packageJson.version = `${process.env.RELEASE_VERSION}`;

fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (err) => {
  if (err) throw err;
  console.log("package.json has been updated!");
});

// Update product name in electron-builder.json

let electronBuilderConfigJsonPath = path.join(
  __dirname,
  "../electron-builder.js"
);
let electronBuilderConfigJson = require(electronBuilderConfigJsonPath);

electronBuilderConfigJson.productName += ` (Alpha)`;

fs.writeFile(
  electronBuilderConfigJsonPath,
  JSON.stringify(electronBuilderConfigJson, null, 2),
  (err) => {
    if (err) throw err;
    console.log("electron-builder.json has been updated!");
  }
);
