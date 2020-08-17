'use strict';
(function () {

  const polka = require('polka');
  const { json } = require('body-parser');
  const Email = require('email-templates');

  const app = polka();

  app.post('/form-submission', (req, res) => {
    const email = new Email({
      preview: true,
      message: {
        from: `kertikristof@gmail.com`,
        subject: `${req.body.msg} feedback`,
      },
      //send: true,
      transport: {
        jsonTransport: true,
        host: "mail.intech.studio",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'shop@intech.studio', // generated ethereal user
          pass: 'macgyver' // generated ethereal password
        }
      }
    });
    
    email.send({
      template: 'feedback',
      message: {
        to: 'kertikristof@intech.studio'
      },
      locals: {
        name: `hello`,
        email: `szia`,
        info: `${'szevasz'}`,
      }
    })
    .then(()=>{
      res.end(JSON.stringify({ msg: 'Feedback email sent.' }))
    })
    .catch(console.error)
  });

  app
    .use(json())
    .listen(3000, err => {
    if (err) throw err;
    console.log(`> Running on localhost:3000`);
  });

  module.exports = app;

}());