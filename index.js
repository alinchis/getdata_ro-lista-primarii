const fs = require('fs-extra');
const glob = require('glob');

// import local modules
const createFolder = require('./modules/create-folder.js');
const getCountiesInfo = require('./modules/get-counties-info.js');
const getLocalitiesInfo = require('./modules/get-localities-info.js');
const getLocalitiesData = require('./modules/get-localities-data.js');

// local paths
const dataPath = './data';
const localPaths = {
  metadata: 'metadata',
  tables: 'tables',
  logs: 'logs',
};

// remote paths
const countiesInfoPath = 'http://www.cnas.ro/map-county'; // 


// ////////////////////////////////////////////////////////////////////////////
// // METHODS

// /////////////////////////////////////////////////////////////////////
// get current date - formated
function getCurrentDate() {
  const today = new Date().toISOString();
  const regex = /^(\d{4}-\d{2}-\d{2})/g;
  // return formated string
  return today.match(regex)[0];
};


// ////////////////////////////////////////////////////////////////////////////
// // MAIN function
async function main() {
  // get current date
  const today = getCurrentDate();
  // create folder paths variables
  const metadataPath = `${dataPath}/${today}/${localPaths['metadata']}`;
  const tablesPath = `${dataPath}/${today}/${localPaths['tables']}`;
  const logsPath = `${dataPath}/${today}/${localPaths['logs']}`;
  // create save files paths variables
  const countiesSavePath = `${metadataPath}/counties.json`;
  const locSavePath = `${metadataPath}/localities.json`;
  const unitsSavePath = `${tablesPath}/units.csv`;
  const servicesSavePath = `${tablesPath}/services.csv`;

  // help text
  const helpText = `\n Available commands:\n\n\
  1. -h : display help text\n\
  2. -m : download metadata for counties and localities\n\
  3. -d : download data for each locality\n\
  4. -c : continue the most recent download\n`;

  // get command line arguments
  const arguments = process.argv;
  console.log('\x1b[34m%s\x1b[0m', '\n@START: CLI arguments >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  console.table(arguments);
  console.log('\n');

  // get third command line argument
  // if argument is missing, -h is set by default
  const mainArg = process.argv[2] || '-h';
  // manual select list of counties for download, leave active only the ones you want to download
  const countiesList = [
    // 'Alba',
    // 'Arad',
    // 'Argeş',
    // 'Bacău',
    // 'Bihor',
    // 'Bistrita Nasaud',
    // 'Botosani',
    // 'Brăila',
    // 'Brașov',
    // 'Buzău',
    // 'Călăraşi',
    // 'Caraş-Severin',
    // 'Cluj',
    // 'Constanţa',
    // 'Covasna',
    // 'Dâmboviţa',
    // 'Dolj',
    // 'Galați',
    // 'Giurgiu',
    // 'Gorj',
    // 'Harghita',
    // 'Hunedoara',
    // 'Ialomița',
    // 'Iasi',
    // 'Ilfov',
    // 'Maramures',
    // 'Mehedinţi',
    // 'Municipiul Bucuresti',
    // 'Mureş',
    // 'Neamt',
    // 'Olt',
    // 'Prahova',
    // 'Salaj',
    // 'Satu Mare',
    // 'Sibiu',
    // 'Suceava',
    // 'Teleorman',
    // 'Timiş',
    // 'Tulcea',
    // 'Valcea',
    // 'Vaslui',
    // 'Vrancea',
  ];

  // run requested command
  // 1. if argument is 'h' or 'help' print available commands
  if (mainArg === '-h') {
    console.log(helpText);

  // 2. else if argument is 'm'
  } else if (mainArg === '-m') {

    // prepare folders // folders are not overriten
    createFolder(1, metadataPath);
    createFolder(2, tablesPath);
    createFolder(3, logsPath);

    // stage 1: get counties info
    console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('STAGE 1: get counties info\n');
    const countiesInfo = await getCountiesInfo(countiesInfoPath, countiesSavePath);

    // stage 2: get localities info
    console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('STAGE 2: get localities info\n');
    const filteredCounties = {
      href: countiesInfo.href,
      counties: countiesInfo.counties.filter( item => countiesList.length > 0 ? countiesList.includes(item.title) : true )
    }
    getLocalitiesInfo(filteredCounties, locSavePath);

     // 3. else if argument is 'd'
  } else if (mainArg === '-d') {

    // stage 3: get localities DATA
    console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.log('STAGE 3: get localities data\n');
    // read localities metadata file
    const localitiesInfo = require(`${metadataPath}/localities.json`);
    // download data
    getLocalitiesData(localitiesInfo, unitsSavePath, servicesSavePath);    

  // 4. else if argument is 'c'
  } else if (mainArg === '-c') {
    // continue most recent download
    // continueDownload(today, countiesList);

    // else print help
  } else {
    console.log(helpText);
  }

}


// ////////////////////////////////////////////////////////////////////////////
// // MAIN
main();
