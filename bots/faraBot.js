const cheerio = require("cheerio");

const { mailer, composeEmail } = require("../util");
const { updateDb, getUsers } = require("../mongodb");
const { Fara } = require("../mongodb/schemas/data");
const moment = require("moment");

const fetchFara = async ({ url, page, today, oneWeekAgo }) => { 
        
        page.on('console', consoleObj => console.log(consoleObj.text()));

        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).        

        await page.select("#P10_DOCTYPE", "ALL") // Select all documents...
        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).        

        await page.$eval(".datepicker input[name='P10_STAMP1']", (el, value) => el.value = value, oneWeekAgo); // One week search range...
        await page.$eval(".datepicker input[name='P10_STAMP2']", (el, value) => el.value = value, today);

        await page.click("input[id='SEARCH']"); // SEARCH
        await page.waitForNavigation();

        const res = await page.evaluate(() => {
            return document.body.innerHTML;
        });

        let $ = cheerio.load(res);
        let trs = $(".t14Standard tbody tr.highlight-row");

        let data = trs.map((i, tr) => {
            const url = $(tr).find("a").attr("href");
            const number = $(tr).find("td[headers='REGISTRATIONNUMBER']").text();
            const registrant = $(tr).find("td[headers='REGISTRANTNAME']").text();
            const text = $(tr).find("td[headers='DOCUMENTTYPE']").text();
            const date = dateFiled = moment($(tr).find("td[headers='STAMPED/RECEIVEDDATE']").text()).valueOf(); /// This must be a number...
            return { number, registrant, date, link: { url, text, dateFiled }};
        }).toArray();

        return data;      
};

const bot = async ({ page, today, oneWeekAgo }) => {

    const url = 'https://efile.fara.gov/ords/f?p=145:10:10176611235469::NO::P10_DOCTYPE:ALL'

    return fetchFara({ url, page, today, oneWeekAgo })
        .then(async(results) => updateDb(results, Fara))
        .then(async({ newData, updates}) => composeEmail({ newData, updates, collection: Fara, date: moment(today, 'MM/DD/YYYY').format("YYYY-DD-MM"), bot: 'fara' })) /// Must transform date for proper file reading!
        .then(async({ newData, updates }) => {
            if(newData.length > 0 || updates.length > 0){
                const emails = await getUsers({ "data.fara": true });
                return mailer({ emails, subject: 'Foreign Lobbyist Disclosure(s)', mailDuringDevelopment: true, date: moment(today, 'MM/DD/YYYY').format("YYYY-DD-MM"), bot: 'fara' }).then((res) => {
                    res = res.length > 0 ? res : 'Fara - nobody to email!';
                    return res;
                });
            } else {
                return "fara - no updates";
            }
        })
};

module.exports = bot;
