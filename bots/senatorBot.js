const cheerio = require("cheerio");
const moment = require("moment");

const { composeEmail, mailer } = require("../util");
const { updateDb, getUsers } = require("../mongodb");
const { Senator } = require("../mongodb/schemas/data");

const fetchContracts = async (url, page) => {
    
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
}

const bot = async (page, today) => {

    return fetchContracts("https://efdsearch.senate.gov/search/", page)
    .then(async(html) => {
        const $ = cheerio.load(html);

        const tds = $(".table-striped tr[role='row'] td").map((i, item) => $(item).text()).toArray()
        const links = $('tbody tr a').map((i, link) => {
            let urlSeg = $(link).attr("href");
            let url = `https://efdsearch.senate.gov${urlSeg}`
            let text = $(link).text();
            return { url, text };
        }).toArray();
    
        const data = links.map((link, x) => {
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
            results.push({
                first: datum.tds[0].trim(),
                last: datum.tds[1].trim(),
                link: datum.link,
                date: moment(datum.tds[4], "MM/DD/YYYY").valueOf()
            })
        });

        return results;
    })
    .then(async(results) => updateDb(results, Senator))
    .then(async({ newData, updates}) => composeEmail({ newData, updates, collection: Senator, date: today,  bot: 'senateCandidates' }))
    .then(async({newData, updates}) => {
        if(newData.length > 0 || updates.length > 0){
            const emails = await getUsers({ "data.senators": true });
            return mailer({ emails, subject: 'Senate Disclosure(s)', mailDuringDevelopment: true, date: today, bot: 'senators' }).then((res) => {
                res = res.length > 0 ? res : 'senators - nobody to email!';
                return res;
            });
        } else {
            return "senators - no updates";
        }
    });
};

module.exports = bot;
