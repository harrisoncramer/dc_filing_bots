const logger = require("../logger");
const cheerio = require("cheerio");
const fs = require("fs");
const util = require("util");
const moment = require("moment");
const path = require("path");
const _ = require("lodash");

const { mailer } = require("../util");

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const fetchContracts = async (url, page) => { 
    try { // Connect to page, get all links...        
        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).        

        const teams = await page.evaluate(() => {

            // Helper function...
            const data = [];
            const DATES_SELECTOR = 'div.title';
            let dates = document.querySelectorAll(DATES_SELECTOR)
            dates.forEach(date => {
                data.push({ 
                    link: date.querySelector("a").href,
                    date: date.innerText.trim().substr(14, date.innerText.trim().length)
                })
            });
            return data;
        });

        return teams
    }
    catch(err){
        throw { message: err.message };
    }
};

const bot = (users, page, today) => new Promise((resolve, reject) => {

    today = "04-03-2019"
    const url = `https://dod.defense.gov/News/Contracts/`; // Fetch today's data...

    fetchContracts(url, page)
        .then(async(contracts) => { // Get the links to all of the new contracts...
            contracts = contracts.filter(contract => moment(new Date(contract.date)).format("MM-DD-YYYY") === today).map(contract => {
                if(!_.isEmpty(contract)){
                    let res = { date: moment(new Date(contract.date)).format("MM-DD-YYYY"), link: contract.link };
                    return res;
                }
            });
            if(contracts.length !== 0){
                await page.goto(contracts[0].link, { waitUntil: 'networkidle2' }); // Go to today and get the info...
                let html = await page.content();
                return { html, link: contracts[0].link, date: contracts[0].date };
            } else {
                throw new Error("No results found.");
            }
           
        })
        .then(async({ html, link, date }) => { // Write to JSON, return array of lines + date name...
            if(html && link && date){
                let fileContent = await readFile(path.resolve(__dirname, "../captured/contracts.json"), { encoding: 'utf8' })
                let JSONfile = JSON.parse(fileContent); // Old data...
                let isOld = JSONfile.filter(jsonObj => jsonObj.link === link).length; // If the object exists within our current array, === 1
                if(!isOld){ // If the object is new...
                    let allData = JSON.stringify(JSONfile.concat({ link, date }));
                    await writeFile(path.resolve(__dirname, "../captured/contracts.json"), allData, 'utf8');
                    const $ = cheerio.load(html);
                    let article = await $("div.container div[itemProp='articleBody']").text();
                    let lines = article.split("\n").filter(ln => ln.trim() !== "").map(ln => ln.trim());
                    return lines;
                }
                return { html, link, date };
            } else {
                throw err;
            }
        })
        .then(async(lines) => { // Parse into tweets...
            
            
            await mailer(users, text, subject);
        })
        .then((res) => { // Send tweets...
            logger.info(`DoD Check –– No updates.`);
            resolve();
        })
        .catch(err => {
            if(err.message === "No results found."){
                logger.info(err.message);
            } else {
                reject(err);
            }
        });
});

module.exports = bot;
