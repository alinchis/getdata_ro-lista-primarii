// get metadata from CNAS server and save it in JSON files

// import libraries
const fs = require('fs-extra');
const axios = require('axios');
const cheerio = require('cheerio');


// ////////////////////////////////////////////////////////////////////////////
// // METHODS

// /////////////////////////////////////////////////////////////////////
// extract counties data
function extractData(htmlData) {
	//   // remove unnecessary '\n' characters & load html
	const $ = cheerio.load(htmlData.replace(/\\n/g, ''));
	// select all 'map' elements (counties list)
	const countiesArr = $('map').children();
	// create new array to hold counties info
	const returnArr = [];
	// if retrieval is successful
	if (countiesArr && countiesArr.length > 0) {
		console.log(`We have retrieved ${countiesArr.length} county items`);
		// for each item in list
		$(countiesArr).each((i, item) => {
			const itemHref = $(item).attr('href');
			const itemTitle = $(item).attr('alt')
				.replace('Primarii ', '')
				.replace('Imobilire ', ''); // ceva eroare la Giurgiu
			// add items to return array, but filter for uniqueness (ilfov has multiple items)
			const obj = returnArr.find(item => item.title == itemTitle);
			// console.log(`${i}:: ${JSON.stringify(obj)}`);
			if (!obj) {
				returnArr.push({
					title: itemTitle,
					href: itemHref,
				})
			};
		});
	} else {
		throw "ERROR retrieving counties info!";
	}
	// return the new array
	return returnArr;
};

// /////////////////////////////////////////////////////////////////////////////
// // EXPORTS
module.exports = async (countiesPath, saveFile) => {
	console.log('\x1b[34m%s\x1b[0m', `PROGRESS: Download Counties info`);

	// declare variables
	let htmlPage = '';
	const countiesList = { counties: [] };
	// // get counties info in HTML format
	await axios.get(countiesPath)
		.then((response) => {
			htmlPage = response.data;
		})
		.catch(err => console.log(err));
	const countiesArr = extractData(htmlPage);
	console.log(`Found ${countiesArr.length} county items.`);
	// write json to file
	const returnObj = {
		href: countiesPath,
		counties: countiesArr,
	};
	// write json to file
	fs.writeFileSync(saveFile, `${JSON.stringify(returnObj)}`, 'utf8', () => console.log(`@CNAS::File ${saveFile} closed!`));
	console.log('@CNAS:: Counties Info file write Done');
}
