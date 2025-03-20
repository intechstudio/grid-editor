const semver = require("semver");
const packageJson = require("../package.json");

const requiredNodeVersion = packageJson.engines.node;
const currentNodeVersion = process.version;

if (!semver.satisfies(currentNodeVersion, requiredNodeVersion)) {
  console.warn(
    `Required Node.js version ${requiredNodeVersion} not satisfied by current version ${currentNodeVersion}.`,
  );
  process.exit(1); // Exit the installation process with an error code
}
