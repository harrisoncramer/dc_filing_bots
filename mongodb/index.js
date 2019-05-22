const loadDB = require('./db');
const logger = require("../logger");
const { Senator, SenateCandidate, Fara } = require("./schemas/data");
const { Aclu } = require("./schemas/aclu");
const { User } = require("./schemas/user");
const { asyncForEach } = require("../util");

const getUsers = async (search) => {
    
    const db = await loadDB();
    const fullUsers = await User.find(search);
    const users = fullUsers.map((user) => user.email);
    await db.disconnect();
    return users;
};

const updateDb = async (data, Model) => {

    if(data.length === 0){
        return [];
    };

    const db = await loadDB();
    const databaseData = await Model.find({});

    /// Determining any of the scraped data is new or contains updates.....
    let newData = updates = [];

    switch(Model){
        case Senator:
        case SenateCandidate:
            newData = data.filter(newObject => !databaseData.some(databaseObject => databaseObject.link === newObject.link));
            break;
        case Fara:
            let possiblyNew = [];
            newData = data.filter(newObject => {
                let isNew = !databaseData.some(databaseObject => (databaseObject.registrant === newObject.registrant));
                if(isNew){ 
                    return isNew 
                } else {
                    possiblyNew.push(newObject);
                    return false;
                };
            });
            if(possiblyNew.length){
                updates = possiblyNew.map(newObject => {
                    const dataForCompare = databaseData.filter(databaseObject => databaseObject.registrant === newObject.registrant); // Array of 1, the correct registrant...
                    let id = '';
                    let newLinks = newObject.allLinks.filter(link => {
                        if(!dataForCompare[0].allLinks.includes(link)){
                            id = dataForCompare[0].id;
                            return true;
                        } else {
                            return false;
                        }
                    });
                    return { registrant: newObject.registrant, newLinks, id };
                }).filter(newObject => newObject.newLinks.length > 0);
            };
            break;
        default:
            newData = updates = [];            
    };

    if(newData.length > 0){ // If new, create new time stamp, and add to database...
        newData = newData.map(item => ({ ...item, createdAt: new Date() }))
        await Model.insertMany(newData).then(() => logger.info(`${Model.modelName} - ${newData.length} documents inserted!`));
    }
    if(updates.length > 0){
        await asyncForEach(updates, async(update) => {
            await Model.updateOne({ "_id": update.id }, { $push: { allLinks : update.newLinks }}).then(() => logger.info(`${Model.modelName} - ${updates.length} documents modified.`));
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
        await Aclu.updateOne({ "borderCase" : dbNumber }, { $set: { "borderCase": number }});
    };

    await db.disconnect();
    return dbNumber < number; // Return either true or false, depending on what database says...

};

module.exports = {
    getUsers,
    updateDb,
    checkBorderCase
}