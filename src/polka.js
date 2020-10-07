'use strict';
(function () {

  const polka = require('polka');
  const { json } = require('body-parser');
  const Email = require('email-templates');
  require('dotenv').config();
  
  const app = polka();

  app.post('/form-submission',
    (req,res,next) => {
      res.locals = {};
      res.locals.name = req.body.name;
      res.locals.email = req.body.email;
      next();
    },
    //newsletter.checkOptIn('editor'),
    (req, res) => {
        const email = new Email({
          preview: false,
          message: {
            from: `${req.body.email}`,
            subject: `Editor Feedback Submission`,
          },
          send: true,
          transport: {
            host: "mail.intech.studio",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL, // generated ethereal user
              pass: process.env.EMAIL_PASS // generated ethereal password
            }
          }
        });
        
        email.send({
          template: 'feedback',
          message: {
            to: 'support@intech.studio'
          },
          locals: {
            name: `${req.body.name}`,
            email: `${req.body.email}`,
            info: `${req.body.msg}`,
          }
        })
        .then(()=>{
          res.end(JSON.stringify({ sent: true }))
        })
        .catch((error)=>{
          console.error(error);
          res.end(JSON.stringify({ sent: false }))
        })
      }
  );

  app
    .use(json())
    .listen(3000, err => {
    if (err) throw err;
    console.log(`> Running on localhost:3000`);
  });

  module.exports = app;

}());