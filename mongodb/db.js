const MongoClient = require('mongodb').MongoClient;

const loadDB = async () => {
    const client = await MongoClient.connect('mongodb://localhost:27017/', { useNewUrlParser: true });
    db = client.db('bots');
    return { db, client };
};

module.exports = loadDB;

// const MongoClient = require('mongodb').MongoClient;

// let db;

// const loadDB = async () => {
//     if (db) {
//         return db;
//     }
//     try {
//         const client = await MongoClient.connect('mongodb://localhost:27017/');
//         db = client.db('bots');
//     } catch (err) {
//         return Promise.reject(err);
//     }
//     return db;
// };

// module.exports = loadDB;

