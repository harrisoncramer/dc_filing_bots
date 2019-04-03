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

const fetchFara = async (url) => { 
    try { // Connect to page, get all links...
        
        let browser = await pupeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        let page = await browser.newPage(); // Create new instance of puppet
        
        await page.setRequestInterception(true) // Optimize (no stylesheets, images)...
        page.on('request', (request) => {
            if(['image', 'stylesheet'].includes(request.resourceType())){
                request.abort();
            } else {
                request.continue();
            }
        });
        
        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
        let assetUrls = await page.$$eval("div[id='apexir_DATA_PANEL'] table td[headers='LINK'] a:first-child", links => links.map(a => a.href)); // Get all links w/in table for current date..
    
        const getLinks = async (url) => {
            
            await page.goto(url, { waitUntil: 'networkidle2' }); // Navigate to each page...

            let rowDataEven = await page.$$eval("div[id='apexir_DATA_PANEL'] tbody tr[class='even']", (trs) => trs.map(tr => tr.innerHTML));
            let rowDataOdd = await page.$$eval("div[id='apexir_DATA_PANEL'] tbody tr[class='odd']", (trs) => trs.map(tr => tr.innerHTML));
            let rowData = rowDataEven.concat(rowDataOdd);
            let registrant = await page.$$eval("div[id='apexir_DATA_PANEL'] tbody td[headers='REGISTRANT_NAME']", (tds) => tds.map(td => td.innerHTML)); 
                registrant = registrant[0]; // These should all be identical...

            let allLinks = rowData.map(row => {
                let $ = cheerio.load(row);
                let newLink = $('a').map((i, link) => $(link).attr("href")).toArray();
                return newLink[0];
            });
            return { allLinks, registrant };
        };
        const promises = await asyncForEach(assetUrls, (url) => getLinks(url));
        await page.close();
        await browser.close();
        return promises;

    }
    catch(err){
        throw { message: err.message };
    }
};

const bot = () => {
    let today = moment().format("MM DD YYYY");
            today = '03 18 2019';
        const todayUri = today.replace(/\s/g,"\%2F"); // Create uri string...
        const link = `https://efile.fara.gov/pls/apex/f?p=181:6:0::NO:6:P6_FROMDATE,P6_TODATE:${todayUri},${todayUri}`; // Fetch today's data...

    fetchFara(link)
    .then(async(links) => {
        try {
            let file = await readFile("./captured/fara.json", { encoding: 'utf8' });
            let JSONfile = JSON.parse(file); // Old data...
            let newData = links.filter(resObj => !JSONfile.some(jsonObj => (jsonObj.registrant === resObj.link && jsonObj.allLinks === resObj.allLinks))); // All new objects that aren't in the old array...
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
        logger.info(`Fara Check –– ${JSON.stringify(registrants)}`);

        let text = '–––New filings––– \n';
        if(res.length > 0){
            res.forEach(({ registrant, allLinks }) => {
                text = text.concat(registrant).concat("\n");
                allLinks.forEach(link => text = text.concat("- " + link + "\n"));
                text = text.concat("\n");
            });
            return mailer(["harrisoncramer@gmail.com"], text);
        } else {
            return Promise.resolve("No updates");
        }
    })
    .catch(err => {
        logger.debug(JSON.stringify(err))
    });
};

bot();

module.exports = bot;
