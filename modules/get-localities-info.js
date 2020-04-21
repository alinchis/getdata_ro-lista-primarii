// get metadata from CNAS server and save it in JSON files

// import libraries
const fs = require('fs-extra');
const axios = require('axios');
const cheerio = require('cheerio');


// ////////////////////////////////////////////////////////////////////////////
// // METHODS

// /////////////////////////////////////////////////////////////////////
// extract locality id from href
function extractLocId(pathStr) {
    const strArr = pathStr.split('/');
    return strArr[strArr.length - 1];
};

// /////////////////////////////////////////////////////////////////////
// extract counties data
function extractData(countyIndex, htmlData) {
    //   // remove unnecessary '\n' characters & load html
    const $ = cheerio.load(htmlData.replace(/\\n/g, ''));
    // select all 'area' elements
    const locArray = $('div .lista_localitati ul');
    // create new array to hold counties info
    const returnArr = [];
    // if retrieval is successful
    if (locArray && locArray.length > 0) {
        console.log(`${countyIndex}:: ${locArray.length} locality arr retrieved`);
        // for each item in list
        $(locArray).children().each((i, item) => {
            const itemHref = $(item).find('a').attr('href');
            const itemId = extractLocId(itemHref);
            const itemTitle = $(item).find('a').html();
            console.log(`${countyIndex}:: ${i} >>> title=${itemTitle}, href=${itemHref}`);
            // add items to return array, but filter for uniqueness (ilfov has multiple items)
            returnArr.push({
                id: itemId,
                title: itemTitle,
                href: itemHref,
            })
        });
    } else {
        throw "ERROR retrieving counties info!";
    }
    // return the new array
    return returnArr;
};

// /////////////////////////////////////////////////////////////////////////////
// // EXPORTS
module.exports = (countiesObj, saveFile) => {
    console.log('\x1b[34m%s\x1b[0m', `PROGRESS: Download Localities info`);

    // for each item in counties array
    Promise.all(countiesObj.counties.map(async (county, ctyIndex) => {
        console.log(`${ctyIndex}:: start downloading localities info ...`);
        // declare variables
        let htmlPage = '';
        // get localities info in HTML format
        await axios.get(county.href)
            .then((response) => {
                htmlPage = response.data;
            })
            .catch(err => console.log(err));
        const locArr = extractData(ctyIndex, htmlPage);
        console.log(`${ctyIndex}:: Found ${locArr.length} locality items.`);
        // return localities info
        return {
            id: county.id,
            title: county.title,
            href: county.href,
            localities: locArr,
        };
    })).then((localities) => {
        console.log(`@CNAS:: Total localities found: ${localities.length}`);
        // create return /save object
        // write json to file
        const returnObj = {
            href: countiesObj.href,
            counties: localities,
        };
        // write json to file
        fs.writeFileSync(saveFile, JSON.stringify(returnObj), 'utf8', () => console.log(`@CNAS::File ${saveFile} closed!`));
        console.log('@CNAS:: Localities Info file write Done');
        // return new value
        return returnObj;
    });
}
