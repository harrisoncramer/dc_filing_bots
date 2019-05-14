require('dotenv').config();

const nodemailerConfig = {
    type: process.env.NODEMAILER_CONFIG,
    user: process.env.NODEMAILER_USER,
    clientId: process.env.NODEMAILER_CLIENT_ID,
    clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
    refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
};

const environment = process.env.NODE_ENV;
const scheduleFifteen = process.env.NODE_ENV === "development" ? '* * * * *' : '*/15 * * * *';
const scheduleFive = process.env.NODE_ENV === "development" ? '* * * * *' : '*/5 * * * *';

module.exports = {
  nodemailerConfig,
  environment,
  scheduleFifteen,
  scheduleFive
};

// From dotenv file...
// CONSUMER_KEY=
// CONSUMER_SECRET=
// ACCESS_TOKEN=
// ACCESS_TOKEN_SECRET= 
//
// And so forth...
//