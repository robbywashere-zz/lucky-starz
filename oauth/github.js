const config = require('config');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;


module.exports = function auth(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENTID,
    clientSecret: config.GITHUB_CLIENTSECRET,
    callbackURL: config.OAUTH_CALLBACK,
  },
  (accessToken, rt, p, cb) => cb(null, { accessToken, profile: p })
  ));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  app.get('/oauth-login',
    passport.authenticate('github', {})
  );

  app.get('/oauth-callback',
    passport.authenticate('github', { failureRedirect: '/oops' }), (req, res) => res.send(`
    <script>
       localStorage.setItem('user', ${JSON.stringify(JSON.stringify(req.user))});
       self.close();
    </script>
    `));
};
