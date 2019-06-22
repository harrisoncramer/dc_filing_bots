const cheerio = require("cheerio");
const pupeteer = require("puppeteer");
const moment = require("moment");

const { mailer } = require("../util");
const { updateDb, getUsers } = require("../mongodb");
const { Fara } = require("../mongodb/schemas/data");

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
            const link = $(tr).find("a").attr("href");
            const number = $(tr).find("td[headers='REGISTRATIONNUMBER']").text();
            const registrant = $(tr).find("td[headers='REGISTRANTNAME']").text();
            const type = $(tr).find("td[headers='DOCUMENTTYPE']").text();
            const date = moment($(tr).find("td[headers='STAMPED/RECEIVEDDATE']", "DD-MMM-YYYY").text()).valueOf(); /// This must be a number...
            return { link, number, registrant, type, date };
        });

        return data;      
};

const bot = async (page, today) => {

    today = today.replace(/-/g,"\/"); // Create uri string...
    const url = 'https://efile.fara.gov/ords/f?p=145:10:10176611235469::NO::P10_DOCTYPE:ALL'

    return fetchFara({ url, page, today })
        .then(async(results) => updateDb(results, Fara))
        .then(async({ newData, updates }) => {
            let text = '–––New filings––– \n';
            if(newData.length + updates.length > 0){
                if(newData.length > 0){
                    newData.forEach(({ registrant, allLinks }) => {
                        text = text.concat(registrant).concat("\n");
                        allLinks.forEach(link => text = text.concat(link + "\n"));
                        text = text.concat("\n");
                    });
                }
                if(updates.length > 0){
                    updates.forEach(({ registrant, links }) => {
                        text = text.concat(`\n–––New Links for ${registrant}`);
                        links.forEach(lk => text = text.concat(`\n${lk}`));
                    });
                }
                
                const emails = await getUsers({ "data.fara": true });
                console.log(emails);        
                return mailer(emails, text, 'Foreign Lobbyist(s)', true).then((res) => {
                    res = res.length > 0 ? res : 'fara - nobody to email!';
                    return res;
                });
            } else {
                return 'fara - no updates';
            }
        })
        .catch((err) => console.log(err));
};

const launchScraper = async () => {
    const browser = await pupeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
    let today = moment().format("MM-DD-YYYY")
    bot(page, today);
};

launchScraper();