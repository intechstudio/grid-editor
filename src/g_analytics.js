const ua = require('universal-analytics');
const uuid = require('uuid');
const { ipcRenderer } = require('electron');

let userId = undefined;

// Retrieve the userid value, and if it's not there, assign it a new uuid.
ipcRenderer.on('get_uuid', (event, arg) => {
  userId = arg || uuid()
});

// (re)save the userid, so it persists for the next app session.
ipcRenderer.handle('set_uuid', userId);

console.log(userId);

var usr = ua('UA-XXXX-XX', userId);

function trackEvent(category, action, label, value) {
  usr
    .event({
      ec: category,
      ea: action,
      el: label,
      ev: value,
    })
    .send();
}

module.exports = { trackEvent }
