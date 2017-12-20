const express = require('express');
const { parse } = require('url');
const fs = require('fs');
const config = require('config');
const oauthGithub = require('./oauth/github');
const sessions = require('./sessions')
const { fetchReadme } = require('./github');
const { get } = require('lodash');
const secure = require('express-force-https');

const app = express();

const dev = (config.NODE_ENV === 'development');
const nextApp = require('next')({ dir: '.', dev, quiet: dev });

const nextAppHandler = nextApp.getRequestHandler();

app.use(secure);
app.use(require('serve-static')(__dirname + '/public'));
app.use(require('body-parser').json());
app.enable("trust proxy");
sessions(app);

nextApp.prepare().then(() => {

  app.get('/logout', (req, res) => {
    res.clearCookie('connect.sid');
    res.redirect('/')
  })

  oauthGithub(app);

  app.get('/readme/:owner/:name', async (req, res, next) => {

    let readme;
    try {
      readme = await fetchReadme({ ...req.params, token: config.GITHUB_API_TOKEN });
    } catch(e) {
      e.statusCode = 500;
      next(e);
    }
    res.send(readme);
    // next();
  })

  app.get('/:owner/:name',(req,res, next) => {
    const parsedUrl = parse(req.url, true)
    const { pathname, query } = parsedUrl
    const awesome = !!(get(pathname.split('/').splice(-2),'1','').match(/^awesome/))
    if (awesome) {
      nextApp.render(req, res, '/repo');
    } else {
      next();
    }
  })

  app.use((req, res) => {
    nextAppHandler(req, res);
  });
  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500)
      .send(err.msg || err.toString());
  });
  app.listen(config.PORT);
});

