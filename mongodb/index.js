const MongoClient = require("mongodb").MongoClient;

// Database url...
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const getUsers = () => new Promise((resolve,reject) => {
    client.connect(async(err) => {
        if(err) reject(err);
        try {
            // Database name + collection...
            const db = await client.db('bots');
            const collection = await db.collection('users');
            const results = await collection.find({}).toArray();
            resolve(results);
        } catch(err) {
            reject(err);
        }
    });
});

module.exports = {
    getUsers
}