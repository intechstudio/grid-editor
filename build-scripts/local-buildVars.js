// This is for local packaged app testing. It will create a buildVariables.json file in the root folder.
const fs = require("fs");
const path = require("path");

let buildVariables = {
  BUILD_ENV: "nightly",
  BUILD_TARGET: "electron",
  BRANCH_NAME: process.env.BRANCH_NAME,
};

fs.writeFile(
  path.join(__dirname, "../buildVariables.json"),
  JSON.stringify(buildVariables, null, 2),
  (err) => {
    if (err) throw err;
    console.log("buildVariables.json has been saved in the root folder!");
  }
);
