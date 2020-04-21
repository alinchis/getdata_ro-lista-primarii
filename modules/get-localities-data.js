// get locality units and services data from CNAS server and save it in CSV files

// import libraries
const fs = require('fs-extra');
const axios = require('axios');
const cheerio = require('cheerio');


// ////////////////////////////////////////////////////////////////////////////
// // METHODS

// /////////////////////////////////////////////////////////////////////
// extract counties data
function replaceROChars(inStr) {
    return inStr
        .replace(/&#x102;/g, 'Ă')
        .replace(/&#x103;/g, 'ă')
        .replace(/&#xE1;/g, 'Â')
        .replace(/&#xE2;/g, 'â')
        .replace(/&#xCE;/g, 'Î')
        .replace(/&#xEE;/g, 'î')
        .replace(/&#x15E;/g, 'Ș')
        .replace(/&#x15F;/g, 'ș')
        .replace(/&#x162;/g, 'Ț')
        .replace(/&#x163;/g, 'ț')
};

// /////////////////////////////////////////////////////////////////////
// extract UNITS data
function extractData(dataArr, county, locality, htmlData) {
    //   // remove unnecessary '\n' characters & load html
    const $ = cheerio.load(htmlData);
    // select all 'unit types' elements
    const unitTypes = $('h2');
    // select all tables
    const tables = $('table');
    // create new arrays to hold return data
    const unitTypesArr = [];

    // if retrieval is successful
    if (unitTypes && unitTypes.length > 0) {
        // console.log(` ${unitTypes.length} unit tipes retrieved`);
        // for each item in list of unit types
        $(unitTypes).each((i, item) => {
            const newItem = $(item).text().trim();
            // console.log(newItem);
            unitTypesArr.push(newItem);
        });

        // for each table in list of tables
        $(tables).each((i, table) => {

            // for each row in table
            $(table).find('tr').each((j, row) => {
                // console.log(`&&&&&& ROW ${$(row).html()}`)
                // if current row is not header row
                if ($(row).find('td').length > 0) {
                    const rowArr = [];
                    // add country column
                    rowArr.push('Romania');
                    // add county column
                    rowArr.push(county);
                    // add locality column
                    rowArr.push(locality);
                    // add group column
                    rowArr.push(unitTypesArr[i]);

                    // forea each column in row
                    $(row).find('td').each((k, item) => {
                        const currentItem = $(item).text().trim();
                        // console.log(`T:${i} | R:${j} | C:${k} >>> ${unitTypesArr[i]} :: ${currentItem}`)
                        // add current column item
                        rowArr.push(currentItem);
                    });
                    console.log(rowArr);
                    dataArr.push(rowArr);
                }
            });
        });
    } else {
        throw "ERROR retrieving counties info!";
    }
};


// /////////////////////////////////////////////////////////////////////////////
// // EXPORTS
module.exports = async (loadObj, unitsSaveFile, servicesSaveFile) => {
    console.log('\x1b[34m%s\x1b[0m', `PROGRESS: Download Localities DATA`);
    // declare variables
    let htmlPage = '';
    
    // create save units array
    const saveUArr = [];
    // add header
    saveUArr.push(['tara', 'judet', 'localitate', 'tip_unitate', 'denumire', 'nume_doctor', 'adresa', 'telefon', 'email', 'website']);

    // create save services array
    const saveSArr = [];
    // add header
    saveSArr.push(['tara', 'judet', 'localitate', 'tip_serviciu', 'denumire', 'specialitate', 'adresa', 'telefon']);

    // load data
    const counties = loadObj.counties;
    // for each item in counties array
    for (let i = 0; i < counties.length; i += 1) {
        console.log(`\n ${i}:: ${counties[i].title} >>>>>>>>>>>>>>>>>>>>>>>>>`);
        const localities = counties[i].localities;
        // for each item in localities array
        for (let j = 0; j < localities.length; j += 1) {
            // console.log(localities[j]);
            // get data for current locality
            await axios.get(localities[j].href)
                .then((response) => {
                    htmlPage = response.data;
                })
                .catch(err => console.log(err));
            
            // extract UNITS html data
            const regexpUnits = /<!-- BEGIN: Units -->(.*)<!-- END: Units -->/gs;
            const matchU = htmlPage.replace(/\\n/g, '').match(regexpUnits);
            // console.log(matchU[0]);
            const unitsHtml = matchU[0]
                .replace(/<!-- BEGIN: Units -->/, '')
                .replace(/<!-- END: Units -->/, '')
                .trim();

            // extract data from html
            if (unitsHtml) extractData(saveUArr, counties[i].title, localities[j].title, unitsHtml);

            // extract SERVICES html data
            const regexpServices = /<!-- BEGIN: Services -->(.*)<!-- END: Services -->/gs;
            const matchS = htmlPage.replace(/\\n/g, '').match(regexpServices);
            // console.log(matchS);
            const servicesHtml = matchS[0]
                .replace(/<!-- BEGIN: Services -->/, '')
                .replace(/<!-- END: Services -->/, '')
                .trim();

            // extract data from html
            if (servicesHtml) extractData(saveSArr, counties[i].title, localities[j].title, servicesHtml);
        };
    };

    // save units array to file
	fs.writeFileSync(unitsSaveFile, replaceROChars(saveUArr.map((row, index) => {
        const firstColItem = index > 0 ? index : 'id';
        // console.log(`#### ${row}`);
        const newRow = [firstColItem, ...row];
        // console.log(`$$$$$ ${newRow}`);
        return newRow.join('#');
    }).join('\n')));
    console.log('@CNAS:: UNITS file write Done!');
    
    // save services array to file
    fs.writeFileSync(servicesSaveFile, replaceROChars(saveSArr.map((row, index) => {
        const firstColItem = index > 0 ? index : 'id';
        const newRow = [firstColItem, ...row];
        return newRow.join('#');
    }).join('\n')));
    console.log('@CNAS:: SERVICES file write Done!');
    
}
