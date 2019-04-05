const cheerio = require("cheerio");
const moment = require("moment");
const logger = require("../logger");
const fs = require("fs");
const util = require("util");

const { mailer } = require("../util");

let readFile = util.promisify(fs.readFile);

const fetchContracts = async (url, page) => {
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
        await Promise.all([
            page.click("#agree_statement"),
            page.waitForNavigation()
        ]);

        await page.click(".form-check-input");

        await Promise.all([
            page.click(".btn-primary"),
            page.waitForNavigation()
        ]);    
        
        await Promise.all([
            page.click('#filedReports th:nth-child(5)'),
            page.waitForResponse('https://efdsearch.senate.gov/search/report/data/')
        ]);

        await Promise.all([
            page.click('#filedReports th:nth-child(5)'),
            page.waitForResponse('https://efdsearch.senate.gov/search/report/data/')
        ]);
        
        await page.waitFor(1000)

        let html = await page.content();
        
        return html;
    } catch(err){
        throw { message: err.message };
    }
}

const bot = (users, page, today) => new Promise((resolve) => {

    fetchContracts("https://efdsearch.senate.gov/search/", page)
    .then(async(html) => {
        let $ = cheerio.load(html);

        let tds = $(".table-striped tr[role='row'] td").map((i, item) => $(item).text()).toArray()
        let links = $('tbody tr a').map((i, link) => $(link).attr("href")).toArray()

        let data = links.map((link, x) => {
            let result = { link, tds: [] };
            for(let i = 0; i < 5; i++){
               result.tds.push(tds[i + (x * 5)]);
            }
            return result;
        });

        return data;
    })
    .then(async(data) => {

        let results = [];
        data.forEach(datum => {
            let no_format_date = new Date(datum.tds[4]).toUTCString();
            let date = moment(no_format_date).format("YYYY-DD-MM");
            if(today === date){
                let link = `https://efdsearch.senate.gov${datum.link}`;
                results.push({
                    first: datum.tds[0],
                    last: datum.tds[1],
                    link
                })
            };
        });

        return results;
    })
    .then(async(results) => {
        try {
            let file = await readFile("./captured/results.json", { encoding: 'utf8' });
            let JSONfile = JSON.parse(file); // Old data...
            let newData = results.filter(resObj => !JSONfile.some(jsonObj => jsonObj.link === resObj.link)); // All new objects that aren't in the old array...
            let allData = JSON.stringify(JSONfile.concat(newData)); // Combine the two to rewrite to file...
            if(newData.length > 0){
                fs.writeFileSync("./captured/results.json", allData, 'utf8'); // Write file...
            }
            return newData; // Return new data only...
        } catch(err){
            throw { message: err.message };
        };
    })
    .then((results) => {
        let text = '–––New filings––– \n';
        if(results.length > 0){
          results.forEach(({ first, last, link}) => {
              let textPlus = `${first} ${last}: ${link}\n`;
              text = text.concat(textPlus);
          });
        
        let emails = users.filter(user => user.senate).map(({ email }) => email);
        return mailer(emails, text, 'Senate Disclosure');

        } else {
            return Promise.resolve("No updates");
        }
    })
    .then((res) => {
        logger.info(`Senator Check –– ${JSON.stringify(res)}`);
        resolve();
    })
    .catch(err => {
        logger.debug(JSON.stringify(err));
    });
});

module.exports = bot;
