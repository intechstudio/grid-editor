const ua = require('universal-analytics');
require('dotenv').config();
const { store } = require('./main-store');
const { v4: uuidv4 } = require('uuid');

// Retrieve the userid value, and if it's not there, assign it a new uuid.
const userId = store.get('userId') || uuidv4();

// (re)save the userid, so it persists for the next app session.
store.set('userId', userId)

var usr = ua("UA-151670067-3", userId);

function trackEvent(category, action, label, value) {
  if(process.env.NODE_ENV !== "development"){
    usr
      .event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
      })
      .send();
  } else {
    console.info(`UA offline during ${process.env.NODE_ENV}!`);
  }
}

module.exports = { trackEvent };

global.trackEvent = trackEvent;