
const nodemailer = require("nodemailer");
const { nodemailerConfig, environment } = require("../keys/config");

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
  

const mailer = (emails, text, subject) => {
    if(environment === 'development')
        return Promise.resolve("Not mailing in dev server...")
    
    const promises = emails.map(email => {
        let HelperOptions = {
            from: 'FiDi Bot <hcramer@nationaljournal.com>',
            to: email,
            subject,
            text
        };
        return transporter.sendMail(HelperOptions);
    });
    
    return Promise.all(promises);
    
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
    mailer,
    asyncForEach,
    formatNumber
}