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
function extractData(dataArr, county, htmlData) {
    //   // remove unnecessary '\n' characters & load html
    const $ = cheerio.load(htmlData);
    // select the only row in main table
    const mainRow = $('tr', '#maintable')[0];
    // select middle column in main row
    const locArr = $(mainRow)
        .children()                 // all 'td' elements
        .eq(1)                      // data is on the second column (2/3)
        .children('.pi_rbox');      // select only data rows

    // if retrieval is successful
    if (locArr && locArr.length > 0) {
        console.log(` ${locArr.length} elements retrieved`);
        // for each item in list
        $(locArr).each((i, item) => {
            const denumire = $(item).children().eq(0).children().eq(0).text();
            const localitate = denumire
                .replace('Primaria Generala', 'Municipiul Bucuresti')
                .replace('Primaria ', '')
                .replace('Sectorului ', 'Sectorul ');
            // let primar = '';
            // let adresa = '';
            // let telefon = '';
        
            const dataItem = $(item).text();
            console.log(dataItem);
            const regexp = /^(.+)Primar:\s(.+)((Adresa|Telefon):\s(.+))\.\.\.\sdetalii/;
            const regexpLigth = /^(.+)Primar:\s(.+)\.\.\.\sdetalii/;
            const match = dataItem.match(regexp);
            const matchLight = dataItem.match(regexpLigth);
            // console.log(matchLight);
            const primar = match && match[2] ? match[2] : (matchLight && matchLight[2] ? matchLight[2] : ''); 
            const adresa = match && match[4] && (match[4].toLowerCase() === 'adresa') ? match[5] : '';
            const telefon = match && match[4] && (match[4].toLowerCase() === 'telefon') ? match[5] : '';

            console.log(`${i}: ${localitate}, ${denumire}\n`);
            // console.log(`${i}: Primar: ${match[2]} / TipInfo: ${match[4]} / Info: ${match[5]}`);
            // console.log(`${i}: ${dataItem}`);
            dataArr.push([
                'Romania',
                county === 'Bucuresti' ? 'Municipiul Bucuresti': county,
                localitate,
                denumire,
                adresa,
                telefon,
                primar
            ]);
        });
    } else {
        throw "ERROR retrieving counties info!";
    }
}


// /////////////////////////////////////////////////////////////////////////////
// // EXPORTS
module.exports = async (rootPath, loadObj, locSaveFile) => {
    console.log('\x1b[34m%s\x1b[0m', `PROGRESS: Download Localities DATA`);
    // declare variables
    let htmlPage = '';
    
    // create save localities array
    const saveLocArr = [];
    // add header
    saveLocArr.push(['tara', 'judet', 'localitate', 'denumire', 'adresa', 'telefon', 'primar']);

    // load data
    const counties = loadObj.counties;
    console.log(counties);
    // for each item in counties array
    for (let i = 0; i < counties.length; i += 1) {
        console.log(`\n ${i}:: ${counties[i].title} >>>>>>>>>>>>>>>>>>>>>>>>>`);
        
        // get data for current county
        await axios.get(`${rootPath}${counties[i].href}`)
            .then((response) => {
                htmlPage = response.data;
            })
            .catch(err => console.log(err));

        // extract data from html
        if (htmlPage) extractData(saveLocArr, counties[i].title, htmlPage);

    }

    // save units array to file
	fs.writeFileSync(locSaveFile, replaceROChars(saveLocArr.map((row, index) => {
        const firstColItem = index > 0 ? index : 'id';
        // console.log(`#### ${row}`);
        const newRow = [firstColItem, ...row];
        // console.log(`$$$$$ ${newRow}`);
        return newRow.join('#');
    }).join('\n')));
    console.log('@portal-info:: RO-primarii.csv file write Done!');
    
}
