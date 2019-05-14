const mongoose = require("mongoose");

const Aclu = mongoose.model('Aclu', {
    borderCase: {
        type: Number
    },
},'aclus');

module.exports = {
    Aclu
};