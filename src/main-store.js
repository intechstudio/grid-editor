const Store = require('electron-store');

const store = new Store({
  defaults: { 
      windowBounds: { 
          width: 1280, 
          height: 800
      },
      profiles_folder: '',
  }
});

module.exports = { store }