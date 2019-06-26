const cheerio = require("cheerio");

const { mailer } = require("../util");
const { updateDb, getUsers } = require("../mongodb");
const { Fara } = require("../mongodb/schemas/data");
const moment = require("moment");

const fetchFara = async ({ url, page, today }) => { 
        
        page.on('console', consoleObj => console.log(consoleObj.text()));

        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).        

        await page.select("#P10_DOCTYPE", "ALL") // Select all documents...
        await page.$eval(".datepicker input[name='P10_STAMP1']", (el, value) => el.value = value, today); // Fill out input dates
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
            const date = moment($(tr).find("td[headers='STAMPED/RECEIVEDDATE']").text()).valueOf(); /// This must be a number...
            return { link: { url, text, date }, number, registrant };
        }).toArray();

        return data;      
};

const bot = async (page, today) => {

    today = today.replace(/-/g,"\/"); // Create uri string...
    const url = 'https://efile.fara.gov/ords/f?p=145:10:10176611235469::NO::P10_DOCTYPE:ALL'

    return fetchFara({ url, page, today })
        .then(async(results) => updateDb(results, Fara))
        .then(async({ newData, updates}) => composeEmail({ newData, updates, collection: Fara, date: today }))
        .then(async({ newData, updates }) => {
            if(newData.length > 0 || updates.length > 0){
                const emails = await getUsers({ "data.fara": true });
                return mailer({ emails, subject: 'Foreign Lobbyist Disclosure(s)', mailDuringDevelopment: true, date: today, bot: 'fara' }).then((res) => {
                    res = res.length > 0 ? res : 'Fara - nobody to email!';
                    return res;
                });
            } else {
                return "fara - no updates";
            }
        })
        .catch((err) => console.log(err));
};

module.exports = bot;
