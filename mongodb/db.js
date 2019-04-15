const MongoClient = require('mongodb').MongoClient;

let db;

const loadDB = async () => {
    if (db) {
        return db;
    }
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017/bots');
        db = client.db('dbname');
    } catch (err) {
        return Promise.reject(err);
    }
    return db;
};

module.exports = loadDB;