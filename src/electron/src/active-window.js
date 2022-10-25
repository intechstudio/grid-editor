const activeWindow = require('active-win');

async function getActiveWindow() {
  return await activeWindow();
}

module.exports = { getActiveWindow };