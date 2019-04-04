const cron = require("node-cron");
const senatorBot = require("./senatorBot");
const senateCandidateBot = require("./senateCandidateBot");
const faraBot = require("./faraBot");
const logger = require("./logger");
const users = require("./keys/users");
const pupeteer = require("puppeteer");

logger.info("App running...");

(async () => {

    const browser = await pupeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet

    // await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
    // page.on('request', (request) => {
    //     if(['image', 'stylesheet'].includes(request.resourceType())){
    //         request.abort();
    //     } else {
    //         request.continue();
    //     }
    // });
    

    logger.info(`Starting checks...`);
    await senatorBot(users, page);
    await senateCandidateBot(users, page); // This sequence matters, because agree statement will not be present...
    await faraBot(users, page);

    await page.close();
    await browser.close();
})();