const logger = require("../logger");

const { Senator, SenateCandidate, Fara } = require("./schemas/data");
const loadDB = require('./db');

const { User } = require("./schemas/user");
const { asyncForEach } = require("../util");

const { faraBusiness, senatorBusiness, senateCandidateBusiness } = require("./business");

const getUsers = async (search) => {
    
    const db = await loadDB();
    const fullUsers = await User.find(search);
    const users = fullUsers.map((user) => {
        user = user.toObject();
        if(user.method === 'google'){
            return user.google.email;
        }
        if(user.method === 'local'){
            return user.local.email;
        }
    });
    await db.disconnect();
    return users;
};

const updateDb = async (data, Model) => {

    let newData = updates = [];

    if(data.length === 0){
        return { newData, updates }; // Return empty arrays w/out new data
    };

    const db = await loadDB();
    const databaseData = await Model.find({});
    let res;

    switch(Model){ /// Determining any of the scraped data is new or contains updates.....
        case Senator:
            res = senateCandidateBusiness({ data, databaseData });
            break;
        case SenateCandidate:
            res = senatorBusiness({ data, databaseData });
            break;
        case Fara:
            res = faraBusiness({ data, databaseData });          
            break;    
    };

    newData = res.newData; 
    updates = res.updates;
    
    if(newData.length > 0){ // If new, create new time stamp, and add to database...
        newData = newData.map(item => ({ ...item }))
        await Model.insertMany(newData).then(() => logger.info(`${Model.modelName} - ${newData.length} documents inserted!`));
    }
    if(updates.length > 0){
        await asyncForEach(updates, async(update) => {
            await Model.updateOne({ "_id": update.id }, { $push: { allLinks : update.links }, $set: { date: update.date }}).then(() => logger.info(`${Model.modelName} - ${updates.length} documents modified.`));
        });
    }
    
    await db.disconnect();
    return { newData, updates };
};

module.exports = {
    getUsers,
    updateDb
}