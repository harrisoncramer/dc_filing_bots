const loadDB = require('./db');

const getUsers = (search) => new Promise(async(resolve,reject) => {
    
    const { db, client } = await loadDB();
    
    const collection = await db.collection('users');
    let results = await collection.find(search).project({ email: 1, _id: 0 }).toArray()  // Get users w/ this search...
    results = results.map(({ email }) => email);

    client.close((err) => {
        if(err) reject(err);
        resolve(results); // Close the connection and return email list...
    });

});

const updateDb = (data, whichCollection) => new Promise(async(resolve, reject) => {

    const { db, client } = await loadDB();

    if(data.length > 0){
        try {
        const collection = await db.collection(whichCollection);
        const results = await collection.find({}).toArray();

        /// Determining any of the scraped data is new....
        let newData;
        switch(whichCollection){
            case 'senators':
            case 'senateCandidates':
                newData = data.filter(resObj => !results.some(jsonObj => jsonObj.link === resObj.link));
                break;
            case 'fara':
                newData = data.filter(resObj => !results.some(jsonObj => (jsonObj.registrant === resObj.registrant && (jsonObj.allLinks.some(link => resObj.allLinks.includes(link)) | ((jsonObj.allLinks.length == 0) && (resObj.allLinks.length == 0 ))))));
                break;
            default:
                newData = [];            
        };

        if(newData.length > 0){ // If new, create new time stamp, and add to database...
            newData = newData.map(item => ({ ...item, createdAt: new Date().toTimeString()}))
            await collection.insertMany(newData);
        }
        client.close((err) => {
            if(err) reject(err);
            resolve(newData); // Close the connection and return the newData list...
        });
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