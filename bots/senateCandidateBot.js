const cheerio = require("cheerio");
const moment = require("moment");

const { mailer, composeEmail } = require("../util");
const { updateDb, getUsers } = require("../mongodb");
const { SenateCandidate } = require("../mongodb/schemas/data");

const fetchContracts = async (url, page) => {

        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).

        await page.click('.form-check-input.candidate_filer');

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
        
        const html = await page.content();
        return html;

}

const bot = async (page, today) => {

    return fetchContracts("https://efdsearch.senate.gov/search/", page) /// Get html...
    .then(async(html) => {  /// Parse html w/ cheerio...
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
    .then(async(data) => { /// Check if each data is new, formatting...

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
    .then(async(results) => updateDb(results, SenateCandidate)) /// Update database w/ new data...
    .then(async({ newData, updates}) => composeEmail({ newData, updates, collection: SenateCandidate, date: today, bot: 'senateCandidates' }))
    .then(async({newData, updates}) => {
        if(newData.length > 0 || updates.length > 0){
            const emails = await getUsers({ "data.senateCandidates": true });
            return mailer({ emails, subject: 'Senate Candidate Disclosure(s)', mailDuringDevelopment: true, date: today, bot: 'senateCandidates' }).then((res) => {
                res = res.length > 0 ? res : 'senateCandidates - nobody to email!';
                return res;
            });
        } else {
            return "senateCandidates - no updates";
        }
    });
};

module.exports = bot;
