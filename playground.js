const moment = require("moment");

const twoDaysAgo = moment().subtract(2, 'days').format("llll")
// const dat2 = day.format("llll");
console.log(twoDaysAgo);