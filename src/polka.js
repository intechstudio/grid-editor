'use strict';
(function () {

  const polka = require('polka');
  const { json } = require('body-parser');
  require('dotenv').config();
  
  const app = polka();

  app
    .use(json())
    .listen(3000, err => {
    if (err) throw err;
    console.log(`> Running on localhost:3000`);
  });

  module.exports = app;

}());