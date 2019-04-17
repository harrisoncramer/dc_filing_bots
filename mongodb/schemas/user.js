const mongoose = require("mongoose");
const User = mongoose.model('User', {
    email: {
        type: String,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    name: {
        type: String,
        require: false
    },
    senateCandidates: {
        type: Boolean,
        require: true,
    },
    senators: {
        type: Boolean,
        require: true,
    },
    fara: {
        type: Boolean,
        require: true,
    }
});

module.exports = {
    User
};