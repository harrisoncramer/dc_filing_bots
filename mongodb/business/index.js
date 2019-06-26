module.exports = {
    faraBusiness: ({ data, databaseData }) => {
        let newBucket = [];
        let updates = [];

        data.forEach((newObject, i) => { // Sort data into 'new' bucket or 'update' bucket depending on link, registrant, and number values...
            let isNew = !databaseData.some(databaseObject => (databaseObject.registrant === newObject.registrant && databaseObject.number === newObject.number));
            if(isNew){
                newBucket.push(newObject);
            } else { // Determine if the link is new and should go into updates bucket...
                let matchingRegistrant = databaseData.filter(databaseObject => (databaseObject.registrant === newObject.registrant && databaseObject.number === newObject.number)); // Array of 1, the correct registrant...
                if(matchingRegistrant.length === 0){ 
                    return; /// No updates, return database object.
                } else if (!matchingRegistrant[0].allLinks.some((link) => link.url === newObject.link.url)){ // Check to see if link is new...
                    updates.push({ link: newObject.link, id: matchingRegistrant[0].id, registrant: matchingRegistrant[0].registrant });
                };
            };
        });

        let newData = newBucket.map((newObject) => { // Change single link to allLinks array...
            newObject.allLinks = [(newObject['link'])];
            delete newObject['link'];
            return newObject;
        }).reduce((accumulator, currentValue) => { // Combine identical items' links into single allLink
            const matching = accumulator.findIndex((obj) => obj.number === currentValue.number && obj.registrant === currentValue.registrant); // Will return -1 if no match...
            if(matching === -1){
                accumulator.push(currentValue);
                return accumulator;
            } else {
                let oldLinks = accumulator[matching].allLinks;
                let newLink = currentValue.allLinks;
                accumulator[matching].allLinks = [ ...oldLinks, ...newLink ];
                return accumulator;
            };
        }, []);

        updates = updates.reduce((accumulator, { id, link, registrant }) => { // Simplify updates by combining new links...
            const matching = accumulator.findIndex((obj) => obj.id === id);
            if(matching === -1){  // Will return -1 if no match...
                accumulator.push({ id, links: [link], registrant });
                return accumulator;
            } else {
                let oldLinks = accumulator[matching].links;
                accumulator[matching].links = [ ...oldLinks, link, registrant ];
                return accumulator;
            };
        }, []);

        return { updates, newData };
    },
    senatorBusiness: ({ data, databaseData }) => {
        let newData = data.filter(newObject => !databaseData.some(databaseObject => databaseObject.link.url === newObject.link.url));
        let updates = [];
        return { updates, newData }
    },
    senateCandidateBusiness: ({data, databaseData }) => {
        let newData = data.filter(newObject => !databaseData.some(databaseObject => databaseObject.link.url === newObject.link.url));
        let updates = [];
        return { updates, newData }
    }
}