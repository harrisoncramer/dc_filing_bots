const cheerio = require("cheerio");
const pupeteer = require("puppeteer");
const moment = require("moment");

const { SenateCandidate  } = require("../mongodb/schemas/data");
const { uploadDocs } = require("./DB");

const parseResults1 = async(html) => {
    const $ = cheerio.load(html);

    const tds = $(".table-striped tr[role='row'] td").map((i, item) => $(item).text()).toArray()
    const links = $('tbody tr a').map((i, link) => $(link).attr("href")).toArray()

    const data = links.map((link, x) => {
        let result = { link, tds: [] };
        for(let i = 0; i < 5; i++){
            result.tds.push(tds[i + (x * 5)]);
        }
        return result;
    });

    return data;
};

const parseResults2 = async(data) => {

    let results = [];
    data.forEach(datum => {

        const link = `https://efdsearch.senate.gov${datum.link}`;
        results.push({
            first: datum.tds[0].trim(),
            last: datum.tds[1].trim(),
            link,
            createdAt: moment(datum.tds[4]).valueOf().toString()
        })
    });

    console.log(results);
    return results;
};

const launchScraper = async() => {

    const browser = await pupeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage(); // Create new instance of puppet
        
    try {
        fetchContracts("https://efdsearch.senate.gov/search/", page)
            .then(parseResults1)
            .then(parseResults2)
            .then(async(results) => {
                let fullresults = results;
                let pageLength = 15;
                let index = 0; // Could be simple for loop, but what are you gonna do...
                while (index < pageLength - 1){

                    index++
                    console.log(`Getting data on page ${index + 1}`);

                    await page.click("a.next");
                    await page.waitFor(1000);
                    let html = await page.content();
                    
                    parseResults1(html).then(parseResults2).then(async(results) => {
                        fullresults.push(...results);
                        console.log(fullresults[index], fullresults.length);
                    });  
                };
                return fullresults;
            })
            .then(async(res) => {
            await uploadDocs(res, SenateCandidate );
            });

    } catch(err) {
       // console.log(err);
    }

};


const fetchContracts = async (url, page) => {
    
    await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
    await Promise.all([
        page.click("#agree_statement"),
        page.waitForNavigation()
    ]);

    await page.click(".candidate_filer");

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

};

launchScraper();