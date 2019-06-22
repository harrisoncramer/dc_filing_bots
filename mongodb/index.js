const moment = require("moment");
const logger = require("../logger");

const { Senator, SenateCandidate, Fara } = require("./schemas/data");
const loadDB = require('./db');

const { Aclu } = require("./schemas/aclu");
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

const updateDb = async (data, Model ) => {

    let newData = updates = [];

    data = data.toArray();

    if(data.length === 0){
        return { newData, updates }; // Return empty arrays w/out new data
    };

    const db = await loadDB();
    const databaseData = await Model.find({});
    let res;

    switch(Model){ /// Determining any of the scraped data is new or contains updates.....
        case Senator:
            res = senateCandidateBusiness({ data, databaseData });
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
            await Model.updateOne({ "_id": update.id }, { $push: { allLinks : update.links }}).then(() => logger.info(`${Model.modelName} - ${updates.length} documents modified.`));
        });
    }
    
    await db.disconnect();
    return { newData, updates };
};

const checkBorderCase = async (number) => {
    
    const db = await loadDB();
    let dbNumber = await Aclu.find();
    dbNumber = dbNumber[0].borderCase;

    // await logger.info(`DB Border Case Docs ${dbNumber}, ACLU Webpage Docs: ${number}`);
    if(dbNumber < number){
        let createdAt = moment().valueOf().toString();
        await Aclu.updateOne({ "borderCase" : dbNumber }, { $set: { "borderCase": number, "createdAt": createdAt }});
    };

    await db.disconnect();
    return dbNumber < number; // Return either true or false, depending on what database says...

};

module.exports = {
    getUsers,
    updateDb,
    checkBorderCase
}