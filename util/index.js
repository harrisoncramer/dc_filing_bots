const fs = require("fs");
const util = require("util");
const path = require("path");
const _ = require("underscore");

const nodemailer = require("nodemailer");
const moment = require("moment");

const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');
const writeFile = (fileName, content) => util.promisify(fs.writeFile)(fileName, content, 'utf8');

const { nodemailerConfig, environment } = require("../config");
const { Senator, SenateCandidate, Fara } = require("../mongodb/schemas/data");

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      type: "OAuth2",
      user: nodemailerConfig.user,
      clientId: nodemailerConfig.clientId,
      clientSecret: nodemailerConfig.clientSecret,
      refreshToken: nodemailerConfig.refreshToken
    }
  });

const mailer = async ({ emails, subject, mailDuringDevelopment, date, bot }) => {
    if(environment === 'development' && !mailDuringDevelopment)
        return Promise.resolve("Not mailing in dev server...")
    
    let fileTime = moment(date, 'YYYY-DD-MM').valueOf();
    let html = await readFile(path.resolve(__dirname, 'emailContent', 'emails', 'sent', `${fileTime}__${date}__${bot}.html`));

    const promises = emails.map(email => {
        let HelperOptions = {
            from: 'DCDOCS <hcramer@nationaljournal.com>',
            to: email,
            subject,
            html,
            attachments: [{
                filename: 'logo.png',
                path: path.resolve(__dirname, 'emailContent', 'emails', 'images', 'logo.png'),
                cid: 'logo' //my mistake was putting "cid:logo@cid" here! 
           }]
        };
        return transporter.sendMail(HelperOptions);
    });
    
    return Promise.all(promises);
    
};

const composeEmail = async ({ newData, updates, collection, date }) => {
    let html = await readFile(path.resolve(__dirname, "./emailContent/blankHtml/index.html"));
    let dynamicHtml = '';
    let dynamicTitle = '';

    if(newData.length > 0){
        switch(collection){
            case Senator:
                newData.forEach(({ first, last, link}) => {
                    let senatorName = `<p style="margin-bottom: 10px; margin-left: 20px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1.42; letter-spacing: -0.4px; color: #151515;">${last}, ${first}:</p>`;
                    let listOpen = '<ul style="margin-left: 20px; margin-top: 0px; padding: 0px; ">';
                    let listItem = `<li style="margin-left: 20px; font-family: Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 500; line-height: 1.42; letter-spacing: -0.4px; color: #151515;"><a href=${link.url}>${link.text}</a></li>`;
                    let listClose = '</ul>';
                    let all = senatorName.concat(listOpen).concat(listItem).concat(listClose);
                    dynamicHtml = dynamicHtml.concat(all);
                });
                dynamicTitle = 'Senate Stock Disclosures'
                break;
            case SenateCandidate:
                newData.forEach(({ first, last, link}) => {
                    let senatorName = `<p style="margin-bottom: 10px; margin-left: 20px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1.42; letter-spacing: -0.4px; color: #151515;">${last}, ${first}:</p>`;
                    let listOpen = '<ul style="margin-left: 20px; margin-top: 0px; padding: 0px; ">';
                    let listItem = `<li style="margin-left: 20px; font-family: Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 500; line-height: 1.42; letter-spacing: -0.4px; color: #151515;"><a href=${link.url}>${link.text}</a></li>`;
                    let listClose = '</ul>';
                    let all = senatorName.concat(listOpen).concat(listItem).concat(listClose);
                    dynamicHtml = dynamicHtml.concat(all);
                });
                dynamicTitle = 'Senate Candidate Stock Disclosures';
                break;
            case Fara:
                // Simple logic for creating Fara body here...
                break;         
        }
    };

    if(updates.length){
        /// Do something else if there are updates!!
        console.log("there are updates, add them to the html too...");
    };

    if(newData.length > 0 || updates.length > 0){ // Write the new file...
        let tmpl = _.template(html);
        let newHtml = tmpl({ target: dynamicHtml, targetTitle: dynamicTitle });
        let fileTime = moment(date, 'YYYY-DD-MM').valueOf();
        await writeFile(path.resolve(__dirname, 'emailContent', 'emails', 'sent', `${fileTime}__${date}__${bot}.html`), newHtml);
    }

    return { newData, updates };
};

const asyncForEach = async(array, callback) => {
    let results = [];
    for (let index = 0; index < array.length; index++) {
        let result = await callback(array[index]);
        results.push(result);
    }
    return results;
};

const formatNumber = (number) => {
    var splitNum;
    number = Math.abs(number);
    number = number.toFixed(0);
    splitNum = number.split('.');
    splitNum[0] = splitNum[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return splitNum.join(".");
  }

module.exports = {
    composeEmail,
    mailer,
    asyncForEach,
    formatNumber
}