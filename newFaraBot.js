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
    for (let index = 0; index < array.length; index++) {
        await callback(array[index]);
    }
};

const fetchFara = async (url) => {
    
    try { // Connect to page, get all links...
        
        let browser = await pupeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        let page = await browser.newPage(); // Create new instance of puppet
        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
        let assetUrls = await page.$$eval("div[id='apexir_DATA_PANEL'] table td[headers='LINK'] a:first-child", links => links.map(a => a.href)); // Get all links w/in table for current date..
    
        const getLinks = async (url) => {
            
            await page.goto(url, { waitUntil: 'networkidle2' }); // Navigate to each page...
                
            let rowDataEven = await page.$$eval("div[id='apexir_DATA_PANEL'] tbody tr[class='even']", (trs) => trs.map(tr => tr.innerHTML));
            let rowDataOdd = await page.$$eval("div[id='apexir_DATA_PANEL'] tbody tr[class='odd']", (trs) => trs.map(tr => tr.innerHTML));
            let rowData = rowDataEven.concat(rowDataOdd);
            let allLinks = rowData.map(row => {
                let $ = cheerio.load(row);
                let newLink = $('a').map((i, link) => $(link).attr("href")).toArray();
                return newLink[0];
            });

            return allLinks;
        };

        const promises = assetUrls.map(url => getLinks(url));

        return Promise.all(promises).then(async(res) => {
            await page.close();
            await browser.close();
            return res;
        });

    }
    catch(err){
        throw { message: err.message };
    }
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

const bot = () => {
    let today = moment().format("MM DD YYYY");
            today = '03 18 2019';
        const todayUri = today.replace(/\s/g,"\%2F"); // Create uri string...
        const link = `https://efile.fara.gov/pls/apex/f?p=181:6:0::NO:6:P6_FROMDATE,P6_TODATE:${todayUri},${todayUri}`; // Fetch today's data...

    fetchFara(link)
    .then((links) => {
        console.log(links)
    })
    .then(async(res) => {
        logger.info(`Fara Check –– ${JSON.stringify(res)}`);
    })
    .catch(err => {
        logger.debug(JSON.stringify(err))
    });
};

bot();

module.exports = bot;
