// Set up Twit bot...
const Twit = require('twit');
const config = require('../../keys/config');
const bot = new Twit(config);

// Export full bot...
module.exports = bot;