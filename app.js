const cron = require("node-cron");
const pupeteer = require("puppeteer");
const moment = require("moment");

const logger = require("./logger");
// const users = require("./keys/users");
const { getUsers } = require("./mongodb");

const senatorBot = require("./bots/senatorBot");
const senateCandidateBot = require("./bots/senateCandidateBot");
const faraBot = require("./bots/faraBot");

const { environment, schedule } = require("./keys/config.js");
const today = environment === "production" ? moment() : moment("04-09-2019");

logger.info(`Running bot in ${environment} on ${today.format("MM-DD-YYYY")}`);

const launchBots = async() => {

    const users = await getUsers();
    const headless = environment === "production";
    const browser = await pupeteer.launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    
    await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
    page.on('request', (request) => {
        if(['image', 'stylesheet'].includes(request.resourceType())){
            request.abort();
        } else {
            request.continue();
        }
    });
    
    logger.info(`Chrome Launched Bots...`);
    
    try {
        await senatorBot(users, page, today.format("YYYY-DD-MM"));
    } catch(err) {
        logger.debug(JSON.stringify(err));
    }

    try {
        await senateCandidateBot(users, page, today.format("YYYY-DD-MM")); // This sequence matters, because agree statement will not be present...
    } catch(err) {
        logger.debug(JSON.stringify(err));
    }

    try {
        await faraBot(users, page, today.format("MM-DD-YYYY"));
    } catch(err) {
        logger.debug(`Bots –– ${JSON.stringify(err)}`);
    }

    await page.close();
    await browser.close();
    logger.info(`Chrome Closed Bots.`);
};


if(environment === 'production'){
    cron.schedule(schedule, async () => {   
        launchBots();
    });
} else if (environment === 'development') {
    launchBots();
} else {
    logger.debug("Environment variable not set.")
};