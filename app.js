const cron = require("node-cron");
const senatorBot = require("./senatorBot");
const senateCandidateBot = require("./senateCandidateBot");
const faraBot = require("./faraBot");
const logger = require("./logger");
const users = require("./keys/users");

logger.info("App running...");

cron.schedule('*/15 * * * *', async () => {
    logger.info(`Starting checks...`);
    
    await senatorBot(users);
    await senateCandidateBot(users);
    await faraBot(users);
});