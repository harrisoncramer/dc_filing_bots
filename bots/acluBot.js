const cheerio = require("cheerio");
const moment = require("moment");

const { mailer } = require("../util");
const { checkBorderCase } = require("../mongodb");
const { Aclu } = require("../mongodb/schemas/aclu");

const checkPage = async (url, page) => {

        await page.goto(url, { waitUntil: 'networkidle2' }); // Ensure no network requests are happening (in last 500ms).
        await page.waitFor(1000)
        
        const html = await page.content();
        return html;
}; 

const bot = (page) => {
    
    const acluUrl = "https://www.aclu.org/cases/sierra-club-v-trump-challenge-trumps-national-emergency-declaration-construct-border-wall";

    return checkPage(acluUrl, page) /// Get html...
        .then(async(html) => {  /// Parse html w/ cheerio...
            const $ = cheerio.load(html);
            const numFilings = $("div.pane-aclu-case-legal-documents li").length;
            return numFilings;
        })
        .then(async(numFilings) => {
            const isNew = await checkBorderCase(numFilings); /// Update database w/ new data...
            return isNew
        })
        .then(async(isNew) => {
            if(isNew){
                const text = `New filing for ACLU Case: ${acluUrl}`;
                return mailer(['hcramer@nationaljournal.com'], text, 'ACLU CASE', true); // This is what gets logged...
            } else {
                return "acluCases - no updates";
            }
        });
};

module.exports = bot;

