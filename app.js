const cron = require("node-cron");
const pupeteer = require("puppeteer");
const moment = require("moment");

const logger = require("./logger");

const senatorBot = require("./bots/senatorBot");
const senateCandidateBot = require("./bots/senateCandidateBot");
const faraBot = require("./bots/faraBot");

const { environment, scheduleFifteen } = require("./keys/config.js");

const setUpPuppeteer = async () => {

    const today = environment === "production" ? moment() : moment("04-09-2019");
    const headless = environment === "production";
    const browser = await pupeteer.launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    
    page.on('error', (err) => {
        logger.error('Puppeteer error.', err);
    });
    
    if(environment === "production"){
        await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
        page.on('request', (request) => {
            if(['image', 'stylesheet'].includes(request.resourceType())){
                request.abort();
            } else {
                request.continue();
            }
        });
    };

    return { today, browser, page };
};

setUpPuppeteer()
    .then(async({ today, browser, page }) => {

        // Runtime logic...
        logger.info(`Starting up program in ${environment} on ${today.format("MM-DD-YYYY")}`);

        if(environment === 'production'){
            cron.schedule(scheduleFifteen, () => {   
                launchFifteenBots({ page, browser, today })
                    .catch(err => logger.error('Launch bot error (15).', err));
            });

        } else if (environment === 'development') {
            // await senatorBot(page, today.format("YYYY-DD-MM")).then(res => logger.info(res));
            // await senateCandidateBot(page, today.format("YYYY-DD-MM")).then(res => logger.info(res));
            await faraBot(page, today.format("MM-DD-YYYY"), today.subtract(7, 'days').format("MM-DD-YYYY")).then(res => logger.info(res));
        }
    })
    .catch((err) => {
        logger.error( err)
    })

/// Launching callbacks....
const launchFifteenBots = async({ page, browser, today }) => {
        
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
        await faraBot(page, today.format("MM-DD-YYYY"), today.subtract(7, 'days').format("MM-DD-YYYY")).then(res => logger.info(res));
    } catch(err) {
        logger.error(`Fara Bot Error - `, err);
    }

    await page.close();
    await browser.close();
    logger.info(`Chrome Closed Bots.`);
};