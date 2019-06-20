const loadDB = require("../mongodb/db");
const { Senator } = require("../mongodb/schemas/data");
const { asyncForEach } = require("../util");
// const moment = require("moment");

const updateTimes = async () => {
    const db = await loadDB();
    const allSenators = await Senator.find({});
    const senators = allSenators.map((senator) => {
        senator = senator.toObject();
        return senator;
    });

    // The old version...
    // await asyncForEach(senators, async (senator) => {
    //     await Senator.updateOne({ _id: senator._id }, { "createdAt": new Date() });
    // });

    // This was used to switch the formatting from "new date()" to simple number strings...
    await asyncForEach(senators, async (senator) => {
        let curDate = senator.createdAt;
        let updatedDate = new Date(curDate).getTime();
        updatedDate = updatedDate.toString();
        if((updatedDate !== "NaN") && (typeof updatedDate === "string")){
            await Senator.updateOne({ _id: senator._id }, { "createdAt": updatedDate });
        } else {
            console.log(curDate, typeof updatedDate, updatedDate);
        }
    });

    await db.disconnect();
};

const uploadDocs = async(docs, Model) => {
    const db = await loadDB();
    await Model.insertMany(docs).then(() => console.log(`${docs.length} documents inserted!`));
}

module.exports = {
    updateTimes,
    uploadDocs
}