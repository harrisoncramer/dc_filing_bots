const cron = require("node-cron");
const pupeteer = require("puppeteer");
const moment = require("moment");

const logger = require("./logger");

const senatorBot = require("./bots/senatorBot");
const senateCandidateBot = require("./bots/senateCandidateBot");
const faraBot = require("./bots/faraBot");
const acluBot = require("./bots/acluBot");

const { environment, scheduleFifteen, scheduleFive } = require("./keys/config.js");
let today = environment === "production" ? moment() : moment("04-09-2019");

logger.info(`Starting up program in ${environment} on ${today.format("MM-DD-YYYY")}`);

const launchFifteenBots = async() => {

    today = environment === "production" ? moment() : moment("04-09-2019");
    const headless = environment === "production";
    const browser = await pupeteer.launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    
    page.on('error', (err) => {
        logger.error('Puppeteer error.', err);
    });

    await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
    page.on('request', (request) => {
        if(['image', 'stylesheet'].includes(request.resourceType())){
            request.abort();
        } else {
            request.continue();
        }
    });
        
    try {
        await senatorBot(page, today.format("YYYY-DD-MM")).then(res => logger.info(res));
    } catch(err) {
        logger.error(`SenatorBot Error - `, err);
    }

    try {
        await senateCandidateBot(page, today.format("YYYY-DD-MM")).then(res => logger.info(res)); // This sequence matters, because agree statement will not be present...
    } catch(err) {
        logger.error(`SenateCandidate Bot Error - `, err);
    }

    try {
        await faraBot(page, today.format("MM-DD-YYYY")).then(res => logger.info(res));
    } catch(err) {
        logger.error(`Fara Bot Error - `, err);
    }

    await page.close();
    await browser.close();
    logger.info(`Chrome Closed Bots.`);
};

const launchFiveBots = async() => {
    
    const headless = environment === "production";
    const browser = await pupeteer.launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    
    page.on('error', (err) => {
        logger.error('Puppeteer error.', err);
    });

    await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
    page.on('request', (request) => {
        if(['image', 'stylesheet'].includes(request.resourceType())){
            request.abort();
        } else {
            request.continue();
        }
    });
        
    try {
        await acluBot(page).then(res => logger.info(res));
    } catch(err) {
        logger.error(`ACLU Bot Error - `, err);
    }

    await page.close();
    await browser.close();
    logger.info(`Chrome Closed Aclu Bot.`);
};


if(environment === 'production'){
    cron.schedule(scheduleFifteen, async () => {   
        launchFifteenBots()
            .catch(err => logger.error('Launch bot error (15).', err));
    });

    cron.schedule(scheduleFive, async() => {
        launchFiveBots()
            .catch(err => logger.error('Launch bot error (5).', err));
    });

} else if (environment === 'development') {
    launchFifteenBots()
        .catch(err => {
            logger.error('Launch bot error (15).', err)
        });

    launchFiveBots()
        .catch(err => {
            logger.error('Launch bot error (5).', err)
        });
        
} else {
    logger.debug("Environment variable not set.");
};