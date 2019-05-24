const moment = require("moment");

const twoDaysAgo = moment().subtract(2, 'days').format("llll")
// const dat2 = day.format("llll");
console.log(twoDaysAgo);

let time = moment().subtract(2, 'days').valueOf();
for(i = 0; i<100; i++){
    let time = moment().subtract(i, 'days').valueOf();
    console.log(time)
};