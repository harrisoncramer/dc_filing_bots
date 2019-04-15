const loadDB = require('./db');

const getUsers = (search) => new Promise(async(resolve,reject) => {
  
    const db = await loadDB();

    try {
    const collection = await db.collection('users');
    let results = await collection.find(search).project({ email: 1, _id: 0 }).toArray()
    results = results.map(({ email }) => email);
    } catch(err){
        reject(err);
    }

    db.close((err) => {
        if(err) reject(err);
        resolve(results);
    });

});

const updateDb = (data, whichCollection, fara) => new Promise(async(resolve, reject) => {
    if(data.length > 0){

        const db = await loadDB();

        try {
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
    } else {
        resolve([]);
    }
});

module.exports = {
    getUsers,
    updateDb
}