const cron = require("node-cron");
const bot = require("./bot");
const logger = require("./logger");

logger.info("App running...");

cron.schedule('*/15 * * * *', () => {
    bot();
});