const mongoose = require("mongoose");

const loadDB = () => mongoose.connect('mongodb://localhost:27017/bots', { useNewUrlParser: true });

module.exports = loadDB;