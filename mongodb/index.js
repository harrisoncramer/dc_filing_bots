const MongoClient = require("mongodb").MongoClient;

// Database url...
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, { useNewUrlParser: true });

const getUsers = (search) => new Promise((resolve,reject) => {
    client.connect(async(err) => {
        if(err) reject(err);
        try {
            // Database name + collection...
            const db = await client.db('bots');
            const collection = await db.collection('users');
            let results = await collection.find(search).project({ email: 1, _id: 0 }).toArray()
            results = results.map(({ email }) => email);

            client.close((err) => {
                if(err) reject(err);
                resolve(results);
            });
        } catch(err) {
            reject(err);
        }
    });
});

const updateDb = (data, whichCollection, fara) => new Promise((resolve, reject) => {
    if(data.length > 0){
        client.connect(async(err) => {
            if(err) reject(err);
            try {
                const db = await client.db('bots');
                const collection = await db.collection(whichCollection);
                const results = await collection.find({}).toArray();
                let newData = fara ? data.filter(resObj => !results.some(jsonObj => (jsonObj.registrant === resObj.registrant && (jsonObj.allLinks.some(link => resObj.allLinks.includes(link)) | ((jsonObj.allLinks.length == 0) && (resObj.allLinks.length == 0 )))))) : data.filter(resObj => !results.some(jsonObj => jsonObj.link === resObj.link)) // All new objects that aren't in the old array...
                if(newData.length > 0){
                    newData = newData.map(item => ({ ...item, createdAt: new Date().toTimeString()}))
                    await collection.insertMany(newData);
                }
                resolve(newData);
            } catch(err){
                reject(err);
            }
        })
    } else {
        resolve([]);
    }
});

module.exports = {
    getUsers,
    updateDb
}