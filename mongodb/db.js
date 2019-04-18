// const MongoClient = require('mongodb').MongoClient;

// const loadDB = async () => {
//     const client = await MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true });
//     db = client.db('bots');
//     return { db, client };
// };

// module.exports = loadDB;


const mongoose = require("mongoose");

const loadDB = () => mongoose.connect('mongodb://localhost:27017/bots', { useNewUrlParser: true });

module.exports = loadDB;