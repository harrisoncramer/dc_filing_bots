
const nodemailer = require("nodemailer");
const config = require("../keys/config");

var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      type: "OAuth2",
      user: config.auth.user,
      clientId: config.auth.clientId,
      clientSecret: config.auth.clientSecret,
      refreshToken: config.auth.refreshToken
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