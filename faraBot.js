const pupeteer = require("puppeteer");
const moment = require("moment");
const nodemailer = require("nodemailer");
const config = require("./keys/config");
const logger = require("./logger");
const fs = require("fs");
const util = require("util");
let readFile = util.promisify(fs.readFile);
const cheerio = require("cheerio");

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    type: "OAuth2",
    user: config.auth.user,
    clientId: config.auth.clientId,
    clientSecret: config.auth.clientSecret,
    refreshToken: config.auth.refreshToken
  }
});

const asyncForEach = async(array, callback) => {
    let results = [];
    for (let index = 0; index < array.length; index++) {
        let result = await callback(array[index]);
        results.push(result);
    }
    return results;
};


const mailer = (emails, text) => {
    const promises = emails.map(email => {
        let HelperOptions = {
            from: 'FiDi Bot <hcramer@nationaljournal.com>',
            to: email,
            subject: `FARA Disclosure`,
            text
        };

        return transporter.sendMail(HelperOptions);
    });

    return Promise.all(promises)
};

const fetchFara = async (url, page) => { 
    try { // Connect to page, get all links...        
        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).        
        const tableHandle = await page.$("div[id='apexir_DATA_PANEL'] tbody"); // page.$("div[id='apexir_DATA_PANEL'] tbody tr[class='even']");
        const html = await page.evaluate(body => body.innerHTML, tableHandle);
        await tableHandle.dispose();

        let $ = cheerio.load(html);
        let links = $('td a:first-child').map((i, link) => $(link).attr("href")).toArray();
        let names = $("td[headers='NAME']").map((i,td) => $(td).text()).toArray();

        links = links.map((link, i) => ({ url: `https://efile.fara.gov/pls/apex/${link}`, registrant: names[i] }));
        const getLinks = async ({ url, registrant }) => {
            
            await page.goto(url, { waitUntil: 'networkidle2' }); // Navigate to each page...

            const bodyHandle = await page.$("body div[id='apexir_DATA_PANEL'] tbody"); // page.$("div[id='apexir_DATA_PANEL'] tbody tr[class='even']");
            const html = await page.evaluate(body => body.innerHTML, bodyHandle);
            await bodyHandle.dispose();

            let $ = cheerio.load(html);
            let allLinks = $('a').map((i, link) => $(link).attr("href")).toArray();

            return { allLinks, registrant };
        };

        const promises = await asyncForEach(links, ({ url, registrant }) => getLinks({ url, registrant }));
        return promises;

    }
    catch(err){
        throw { message: err.message };
    }
};

const bot = (users, page) => new Promise((resolve) => {
    let today = moment().format("MM DD YYYY");
            // today = '03 13 2019';
        const todayUri = today.replace(/\s/g,"\%2F"); // Create uri string...
        const link = `https://efile.fara.gov/pls/apex/f?p=181:6:0::NO:6:P6_FROMDATE,P6_TODATE:${todayUri},${todayUri}`; // Fetch today's data...

    fetchFara(link, page)
        .then(async(links) => {
            try {
                let file = await readFile("./captured/fara.json", { encoding: 'utf8' });
                let JSONfile = JSON.parse(file); // Old data...
                let newData = links.filter(resObj => !JSONfile.some(jsonObj => (jsonObj.registrant === resObj.registrant && jsonObj.allLinks.some(link => resObj.allLinks.includes(link))))); // All new objects that aren't in the old array...
                let allData = JSON.stringify(JSONfile.concat(newData)); // Combine the two to rewrite to file...
                if(newData.length > 0){
                    fs.writeFileSync("./captured/fara.json", allData, 'utf8'); // Write file...
                }
                return newData; // Return new data only...
            } catch(err){
                throw { message: err.message };
            };
        })
        .then(async(res) => {

            let registrants = res.map(data => data.registrant);
            let text = '–––New filings––– \n';
            if(res.length > 0){
                res.forEach(({ registrant, allLinks }) => {
                    text = text.concat(registrant).concat("\n");
                    allLinks.forEach(link => text = text.concat(link + "\n"));
                    text = text.concat("\n");
                });

                let emails = users.map(({ email }) => email);
                return mailer(emails, text);
            } else {
                return Promise.resolve("No updates");
            }
        })
        .then((res) => {
            logger.info(`FARA Check –– ${JSON.stringify(res)}`);
            resolve();
        })
        .catch(err => {
            logger.debug(JSON.stringify(err))
        });
});

module.exports = bot;
