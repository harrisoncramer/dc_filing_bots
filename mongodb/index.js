const loadDB = require('./db');
const logger = require("../logger");
const { Senator, SenateCandidate, Fara } = require("./schemas/data");
const { User } = require("./schemas/user");

const getUsers = async (search) => {
    
    const db = await loadDB();
    const usersObj = await User.find();
    const users = usersObj.map((user) => user.email);
    return db.disconnect().then(() => users);

};

getUsers({ email: 'hcramer@nationaljournal.com'})
    .then(res => console.log(res))
    .catch(err => console.log(err));

const updateDb = async (data, whichCollection) => {

    const { db, client } = await loadDB();

    if(data.length > 0){
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
            await collection.insertMany(newData).then(() => logger.info(`${whichCollection} - ${newData.length} documents inserted!`));
        }
        
        const closing = client.close();
        return closing.then(() => newData);
    } else {
        return [];
    }
};

module.exports = {
    getUsers,
    updateDb
}