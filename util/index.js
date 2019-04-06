
const nodemailer = require("nodemailer");
const { nodemailerConfig } = require("../keys/config");

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
    const promises = emails.map(email => {
        let HelperOptions = {
            from: 'FiDi Bot <hcramer@nationaljournal.com>',
            to: email,
            subject,
            text
        };

        return transporter.sendMail(HelperOptions);
    });

    return Promise.all(promises)
};

const asyncForEach = async(array, callback) => {
    let results = [];
    for (let index = 0; index < array.length; index++) {
        let result = await callback(array[index]);
        results.push(result);
    }
    return results;
};


module.exports = {
    mailer,
    asyncForEach
}