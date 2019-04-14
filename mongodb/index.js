const MongoClient = require("mongodb").MongoClient;

// Database url...
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, { useNewUrlParser: true });

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

const updateSenators = (data) => new Promise((resolve, reject) => {
    // console.log(data);
    client.connect(async(err) => {
        if(err) reject(err);
        try {
            const db = await client.db('bots');
            const collection = await db.collection('senators');
            const results = await collection.find({}).toArray();
            const newData = data.filter(resObj => !results.some(jsonObj => jsonObj.link === resObj.link)); // All new objects that aren't in the old array...
            if(newData.length > 0){
                await collection.insertMany(newData);
            }
            resolve(newData);
        } catch(err){
            reject(err);
        }
    })
});

module.exports = {
    getUsers,
    updateSenators
}