const pupeteer = require("puppeteer");
const moment = require("moment");

const logger = require("./logger");
const users = require("./keys/users");

const senatorBot = require("./bots/senatorBot");
const senateCandidateBot = require("./bots/senateCandidateBot");
const faraBot = require("./bots/faraBot");
const contractBot = require("./bots/dodContractBot");

logger.info("App running...");

(async () => {
    const browser = await pupeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    const today = moment("2019-04-02")

    await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
    page.on('request', (request) => {
        if(['image', 'stylesheet'].includes(request.resourceType())){
            request.abort();
        } else {
            request.continue();
        }
    });
    
    logger.info(`Chrome Launched...`);
    
    
    // try {
    //     await senatorBot(users, page, today.format("YYYY-DD-MM"));
    // } catch(err) {
    //     logger.debug(JSON.stringify(err));
    // }

    // try {
    //     await senateCandidateBot(users, page, today.format("YYYY-DD-MM")); // This sequence matters, because agree statement will not be present...
    // } catch(err) {
    //     logger.debug(JSON.stringify(err));
    // }

    // try {
    //     await faraBot(users, page, today.format("MM-DD-YYYY"));
    // } catch(err) {
    //     logger.debug(JSON.stringify(err));
    // }

    try {
        await contractBot(users, page, today.format("MM-DD-YYYY"));
    } catch(err) {
        logger.debug(`DoD-Bots __ ${JSON.stringify(err)}`);
    }

    await page.close();
    await browser.close();
    logger.info(`Chrome Closed DoD-Checker.`);
})();