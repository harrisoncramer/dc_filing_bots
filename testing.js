const senatorBot = require("./senatorBot");
const senateCandidateBot = require("./senateCandidateBot");
const faraBot = require("./faraBot");
const logger = require("./logger");

logger.info("App running...");

(async () => {
    logger.info(`Starting checks...`);
    await senatorBot();
    await senateCandidateBot();
    await faraBot();
})();