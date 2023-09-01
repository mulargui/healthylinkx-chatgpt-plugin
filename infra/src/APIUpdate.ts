const constants = require('./envparams.ts');
const {
	RDSClient,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
    LambdaClient,
    UpdateFunctionCodeCommand
} = require("@aws-sdk/client-lambda");
const fs = require('graceful-fs');
const exec = require('await-exec');
const AdmZip = require('adm-zip');
const replace = require('replace-in-file');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ======== function to create a lambda ============
async function UpdateLambda(name)
{
	try {
		//create the package
		const file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/index.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.js');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/' + name + '.zip');		

		// read the lambda zip file  
		const filecontent = fs.readFileSync(constants.ROOT+'/api/src/' + name + '.zip');

		//update the lambda
		const params = {
			ZipFile: filecontent,
			FunctionName: name
		};
		const lambda = new LambdaClient({});				
		var data = await lambda.send(new UpdateFunctionCodeCommand(params));
		console.log('Success. ' + name + ' lambda updated.');
		
		//remove the package created
		await fs.unlinkSync(constants.ROOT + '/api/src/' + name + '.zip');
		
	} catch (err) {
		console.log("Error. ", err);
		throw err;
	}
}

// ====== update lambdas ========
async function APIUpdate() {

	try {

		//URL of the database
		const rdsclient = new RDSClient({});
		data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		const endpoint = data.DBInstances[0].Endpoint.Address;
		console.log("DB endpoint: " + endpoint);

		// create contants.js with env values
		fs.copyFileSync(constants.ROOT+'/api/src/constants.template.js', constants.ROOT+'/api/src/constants.js');
		const options = {
			files: constants.ROOT+'/api/src/constants.js',
			from: ['ENDPOINT', 'DBUSER', 'DBPWD'],
			to: [endpoint, constants.DBUSER, constants.DBPWD]
		};
		await replace(options);
		console.log("Success. Constants updated.");
		
		// install api node language dependencies
		await exec(`cd ${constants.ROOT}/api/src; npm install`);

		//update the lambdas
		await UpdateLambda('providers');
			
		// cleanup of files created	
		await fs.unlinkSync(constants.ROOT + '/api/src/package-lock.json');
		await fs.unlinkSync(constants.ROOT + '/api/src/constants.js');
		await fs.rmdirSync(constants.ROOT + '/api/src/node_modules', { recursive: true });

	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIUpdate;
