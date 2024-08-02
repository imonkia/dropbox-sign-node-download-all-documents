import 'dotenv/config';
import { select, confirm } from '@inquirer/prompts';
import * as DropboxSign from '@dropbox/sign';
import fs from 'fs';

// Initialize an instance of SignatureRequestApi object
const signatureRequestApi = new DropboxSign.SignatureRequestApi();
// Set the "username" to the API Key
signatureRequestApi.username = process.env.API_KEY || '';

console.log('***************************************************************************************');
console.log('* This app will download all your documents from Dropbox Sign via API.                *');
console.log('* You will be asked to select between downloading just YOUR documents                 *');
console.log('* or ALL documents for your team - if you are part of a team.                         *');
console.log('* You will also have the option to select between downloading PDF or ZIP files.       *');
console.log('* The file name of each file will default to its corresponding signature request ID.  *');
console.log('* Existing files with matching file names will be overwritten.                        *');
console.log('***************************************************************************************\n\n');
console.log('*** Depending on the amount of files, this process may take some time. ***\n\n');

// Console prompt acknowledgement
const acknowledge: boolean = await confirm ({
	message: 'Continue?'
});

!acknowledge && process.exit();

// Console prompt to determine accountId or exit program
const allOrNot: string = await select({
	message: 'Did you want to download documents for ALL members of your team?\n',
	choices: [
		{name: 'Yes, download for all team members', value: 'Yes'},
		{name: 'No, download just my documents', value: 'No'},
		{name: 'Nevermind, quit program', value: 'Exit'}
	],
});

if (allOrNot === 'Exit') {
	console.log('\nExiting the program...');
	process.exit();
} else {
	// If yes to documents for all members of a team, set the account_id to 'all'
	let accountId = (allOrNot === 'Yes') ? 'all' : undefined;
	// Initial page_size
	let pageSize: number = 1;
	let totalNumResults: number = 0;
	// Array to later store all signature request IDs
	let signatureRequestIds: any | string = [];
	
	// Send request to the Dropbox Sign API
	try {
		// First request to get total of number of signature requests
		const page: number = 1;
		const results = await signatureRequestApi.signatureRequestList(accountId, page , pageSize);
		totalNumResults = results.body.listInfo?.numResults || 0;
		// If no signature requests found, exit the program
		if (totalNumResults === 0) {
			console.log('There are no signature requests associated with this account. Exiting the program...\n');
			process.exit();
		} else {
			console.log(`Total number of signature requests: ${totalNumResults}\n`);
		};
	} catch (error) {
		error instanceof DropboxSign.HttpError && console.error(`Error: ${error.body?.error.errorMsg}. Exiting the program...\n`);
		process.exit();
	};
	
	// Loop through result pages to gather all signature request IDs
	try {
		// Updating the page size here to minimize the number of API calls
		pageSize = 100;
		// Calculating the number of pages within this app to avoid an unnecesary API call
		let totalNumPages = Math.ceil(totalNumResults / pageSize);
		console.log('Gathering signature request IDs...\n\nThis process may take some time...\n\n')
		for (var page = 1; page <= totalNumPages; page++) {
			const results = await signatureRequestApi.signatureRequestList(accountId, page, pageSize);
			// Add results to the signatureRequestIds array
			signatureRequestIds = signatureRequestIds.concat(results.body.signatureRequests?.map(signatureRequest => signatureRequest.signatureRequestId) || []);
		};
	} catch (error) {
		error instanceof DropboxSign.HttpError && console.error(`Error: ${error.body?.error.errorMsg}. Exiting the program...\n`);
		process.exit();
	};

	// Console prompt to determine fileType or exit program
	let fileType: any = await select({
		message: 'Would you like to download the documents as a PDF or ZIP file?\n',
		choices: [
			{name: 'Download all as PDF', value: 'pdf'},
			{name: 'Download all as ZIP', value: 'zip'},
			{name: 'Nevermind, quit program', value: 'Exit'}
		],
	});

	if (fileType === 'Exit') {
		console.log('\nExiting the program...');
		process.exit();
	} else {
		console.log(`Downloading all ${totalNumResults} files...\n\nThis process may take some time...\n\n`);
		// Create a 'files' directory if it doesn't exist
		!fs.existsSync('./files') && fs.mkdirSync('./files');
		try {
			// Loop through the signature request ID array and download the documents
			for (var i = 0; i < signatureRequestIds.length; i++) {
				const signatureRequestId = signatureRequestIds[i];
				const result = await signatureRequestApi.signatureRequestFiles(signatureRequestId, fileType);
				fs.createWriteStream(`./files/${signatureRequestId}.${fileType}`).write(result.body);	
			};
			console.log(`Finished downloading all ${totalNumResults} files!\n`);
		} catch (error) {
			error instanceof DropboxSign.HttpError && console.error(`Error: ${error.body?.error.errorMsg}. Exiting the program...\n`);
			process.exit();
		};
	};
};
