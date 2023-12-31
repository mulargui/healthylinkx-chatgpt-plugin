const constants = require('./envparams.ts');
const {
	RDSClient,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const { 
	IAMClient, 
	CreateRoleCommand 
} = require("@aws-sdk/client-iam");
const {
    LambdaClient,
    CreateFunctionCommand,
	AddPermissionCommand
} = require("@aws-sdk/client-lambda");
const {
    APIGatewayClient,
    CreateRestApiCommand,
	CreateResourceCommand,
	GetResourcesCommand,
	PutMethodCommand,
	PutIntegrationCommand,
	CreateDeploymentCommand
} = require("@aws-sdk/client-api-gateway");
const fs = require('graceful-fs');
const exec = require('await-exec');
const AdmZip = require('adm-zip');
const replace = require('replace-in-file');

// ======== helper function ============
function sleep(secs) {
	return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

// ======== function to create a lambda ============
async function CreateLambda(name)
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

		//create the lambda
		const params = {
			Code: {
				ZipFile: filecontent
			},
			FunctionName: name,
			Handler: 'index' + '.handler',
			Role: 'arn:aws:iam::' + process.env.AWS_ACCOUNT_ID + ':role/healthylinkx-lambda',
			Runtime: 'nodejs18.x',
			Description: name + ' api lambda'
		};
		const lambda = new LambdaClient({});				
		var data = await lambda.send(new CreateFunctionCommand(params));
		console.log('Success. ' + name + ' lambda created.');
		
		//remove the package created
		await fs.unlinkSync(constants.ROOT + '/api/src/' + name + '.zip');

		return data.FunctionArn;
		
	} catch (err) {
		console.log("Error. ", err);
		throw err;
	}
}

// ====== create enpoint in api gateway =====
async function AddEndpoint(gwid, endpoint, lambdaArn) {
	try {
				
		const apigwclient = new APIGatewayClient({});

		// id of '/' path 
		var data = await apigwclient.send(new GetResourcesCommand({restApiId:gwid}));
		var rootpathid;
		for (const item of data.items) {
			if(item.path === '/') rootpathid = item.id;
		}
		
		//create the resource (/endpoint)
		var data = await apigwclient.send(new CreateResourceCommand({parentId: rootpathid, pathPart: endpoint, restApiId: gwid}));
		const endpointid = data.id;
		console.log('Success. /' + endpoint + ' created.');

		//create the method (GET)
		var data = await apigwclient.send(new PutMethodCommand({authorizationType: 'NONE', 
			httpMethod: 'GET', resourceId: endpointid, restApiId: gwid}));
		
		//link the lambda to the method
		var data = await apigwclient.send(new PutIntegrationCommand({httpMethod: 'GET',
			resourceId: endpointid, restApiId: gwid, type: "AWS_PROXY",
			integrationHttpMethod: 'POST',
			uri: 'arn:aws:apigateway:'+ process.env.AWS_REGION +':lambda:path/2015-03-31/functions/' + lambdaArn + '/invocations'}));

		//allow apigateway to call the lambda
		const lambda = new LambdaClient({});				
		await lambda.send(new AddPermissionCommand({Action: 'lambda:InvokeFunction',
			FunctionName: endpoint, Principal: 'apigateway.amazonaws.com',
			StatementId: 'api-lambda'}));
		console.log('Success. /' + endpoint + ' linked to the lambda.');
		
	} catch (err) {
		console.log("Error. ", err);
		throw err;
	}
}

// ====== create lambdas and API gateway =====
async function APICreate() {

	try {
		//create a IAM role under which the lambdas will run
		const iamclient = new IAMClient({});
		const roleparams = {
			AssumeRolePolicyDocument: '{"Version": "2012-10-17","Statement": [{ "Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}',
			RoleName: 'healthylinkx-lambda'
		};
		await iamclient.send(new CreateRoleCommand(roleparams));
		console.log("Success. IAM role created.");
		// wait a few seconds till the role is created. otherwise there is an error creating the lambda
		await sleep(10);

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

		//create the lambdas
		const providersLambdaArn = await CreateLambda('providers');
			
		// cleanup of files created	
		await fs.unlinkSync(constants.ROOT + '/api/src/package-lock.json');
		await fs.unlinkSync(constants.ROOT + '/api/src/constants.js');
		await fs.rmdirSync(constants.ROOT + '/api/src/node_modules', { recursive: true });

		//create the api gateway
		const apigwclient = new APIGatewayClient({});
		var data = await apigwclient.send(new CreateRestApiCommand({name: 'healthylinkx'}));
		const gwid = data.id;
		console.log("Success. API Gateway created.");

		//create the endpoints
		await AddEndpoint(gwid, 'providers', providersLambdaArn);
		
		//deploy all
		await apigwclient.send(new CreateDeploymentCommand({restApiId: gwid, stageName: 'prod'}));
		console.log("Success. API Gateway deployed.");

		console.log('URL of the api: https://' + gwid + '.execute-api.' + process.env.AWS_REGION + '.amazonaws.com/prod/');

	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APICreate;
