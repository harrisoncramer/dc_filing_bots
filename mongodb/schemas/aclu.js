const mongoose = require("mongoose");

const Aclu = mongoose.model('Aclu', {
    borderCase: {
        type: Number
    },
    createdAt: {
        type: String
    }
},'aclus');

module.exports = {
    Aclu
};