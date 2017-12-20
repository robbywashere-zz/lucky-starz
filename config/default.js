
const path = require('path');
const fs = require('fs');


if (!fs.existsSync(path.join('..','.env')) && process.env.NODE_ENV === 'development') {
  console.error(`**** \n ERROR: Cannot locate .env file! \n ***`);
}
require('dotenv').config(); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 3000,
  APP_SECRET: process.env.APP_SECRET,
  GITHUB_CLIENTID: process.env.GITHUB_CLIENTID,
  GITHUB_CLIENTSECRET: process.env.GITHUB_CLIENTSECRET,
  OAUTH_CALLBACK: process.env.OAUTH_CALLBACK,
  GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN,
};
