const mongoose = require("mongoose");

const Fara = mongoose.model('Fara', {
    allLinks: {
        type: Array,
        require: true
    },
    registrant: {
        type: String,
        require: true,
    },
    createdAt: {
        type: String,
        require: true,
    }
},'fara');

const SenateCandidate = mongoose.model('SenateCandidate', {
    first: {
        type: String,
        require: true
    },
    last: {
        type: String,
        require: true,
    },
    link: {
        type: String,
        require: true,
    },
    createdAt: {
        type: String,
        require: true,
    }
}, 'senateCandidates');

const Senator = mongoose.model('Senator', {
    first: {
        type: String,
        require: true
    },
    last: {
        type: String,
        require: true,
    },
    link: {
        type: String,
        require: true,
    },
    createdAt: {
        type: String,
        require: true,
    }
}, 'senators' );

module.exports = {
    Fara,
    SenateCandidate,
    Senator
};