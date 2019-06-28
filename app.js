require('dotenv').config();

const cron = require("node-cron");
const pupeteer = require("puppeteer");
const moment = require("moment");

const logger = require("./logger");

const senatorBot = require("./bots/senatorBot");
const senateCandidateBot = require("./bots/senateCandidateBot");
const faraBot = require("./bots/faraBot");

/// Set up web browser....
const setUpPuppeteer = async () => {

    const today = process.env.NODE_ENV === "production" ? moment() : moment("04-09-2019");
    const headless = process.env.NODE_ENV === "production";
    const browser = await pupeteer.launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    
    page.on('error', (err) => {
        logger.error('Puppeteer error.', err);
    });
    
    if(process.env.NODE_ENV === "production"){
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

/// Launching callbacks....
const launchFifteenBots = async({ page, today, env }) => {
    
    let catcher = (err, bot) => env === 'production' ? logger.error(bot, err) : console.log(bot, err);

    try {
        await senatorBot(page, today.format("YYYY-DD-MM")).then(res => logger.info(res));
    } catch(err){
        catcher(err, 'senatorBot');
    };

    try {
        await senateCandidateBot(page, today.format("YYYY-DD-MM")).then(res => logger.info(res)); // This sequence matters, because agree statement will not be present...
    } catch(err) {
        catcher(err, 'SenateCandidate');
    };

    try {
        await faraBot(page, today.format("MM-DD-YYYY"), today.subtract(7, 'days').format("MM-DD-YYYY")).then(res => logger.info(res));
    } catch(err) {
        catcher(err, 'faraBot');
    };
}

if(process.env.NODE_ENV === 'production'){
    logger.info(`Starting up bots in ${process.env.NODE_ENV} at ${moment().format("llll")}`);
    cron.schedule('*/15 * * * *', async () => {
        try {
            let { today, browser, page } = await setUpPuppeteer();
            logger.info(`Running program at ${today.format("llll")}`);
            await launchFifteenBots({ page, today, env: process.env.NODE_ENV });
            await page.close();
            await browser.close();
            logger.info(`Chrome Closed Bots.`);
        } catch (err){
            logger.error('Root Error (15 minute bot).', err);
        }                
    });
} else if (process.env.NODE_ENV === 'development') {
    (async () => {
        try {
            let { today, browser, page } = await setUpPuppeteer();
            logger.info(`Running program at ${today.format("llll")}`);
            await launchFifteenBots({ page, today, env: process.env.NODE_ENV });
            await page.close();
            await browser.close();
            logger.info(`Chrome Closed Bots.`);
        } catch (err){
            logger.error('Root Error in development', err);
        }
    })();
};