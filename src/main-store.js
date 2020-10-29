const Store = require('electron-store');

const store = new Store({
  defaults: { 
      windowBounds: { 
          width: 800, 
          height: 600
      },
      profiles_folder: '',
  }
});

module.exports = { store }