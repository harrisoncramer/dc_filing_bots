require('dotenv').config();

const nodemailerConfig = {
    type: process.env.NODEMAILER_CONFIG,
    user: process.env.NODEMAILER_USER,
    clientId: process.env.NODEMAILER_CLIENT_ID,
    clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
    refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
};

const twitConfig = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

module.exports = {
  twitConfig, 
  nodemailerConfig
};

// From dotenv file...
// CONSUMER_KEY=
// CONSUMER_SECRET=
// ACCESS_TOKEN=
// ACCESS_TOKEN_SECRET= 
//
// And so forth...
//