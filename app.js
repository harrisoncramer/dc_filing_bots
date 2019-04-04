const cron = require("node-cron");
const senatorBot = require("./senatorBot");
const senateCandidateBot = require("./senateCandidateBot");
const faraBot = require("./faraBot");
const logger = require("./logger");
const users = require("./keys/users");

logger.info("App running...");

cron.schedule('*/15 * * * *', async () => {    
    const browser = await pupeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    const today = moment();

    await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
    page.on('request', (request) => {
        if(['image', 'stylesheet'].includes(request.resourceType())){
            request.abort();
        } else {
            request.continue();
        }
    });
    
    logger.info(`Chrome Launched...`);
    
    await senatorBot(users, page, today.format("YYYY-DD-MM"));
    await senateCandidateBot(users, page, today.format("YYYY-DD-MM")); // This sequence matters, because agree statement will not be present...
    await faraBot(users, page, today.format("MM-DD-YYYY"));

    await page.close();
    await browser.close();
    logger.info(`Chrome Closed.`);

});