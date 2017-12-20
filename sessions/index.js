const config = require('config');
module.exports = function sessions(app) {
  if (process.env.NODE_ENV === "production") {
    app.use(require('cookie-parser')());
    app.use(require('express-session')({
      secret: config.APP_SECRET,
      resave: true,
      saveUninitialized: true,
    }));
  } else {
    app.use( require('cookie-session')({
      name: 'session',
      secret: config.APP_SECRET, 
      maxAge: 24 * 60 * 60 * 1000,
    }))
  }
}
