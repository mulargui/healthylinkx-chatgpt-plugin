
const { 
	IAMClient, 
	DeleteRoleCommand 
} = require("@aws-sdk/client-iam");
const {
    LambdaClient,
    DeleteFunctionCommand
} = require("@aws-sdk/client-lambda");
const {
    APIGatewayClient,
    GetRestApisCommand,
	DeleteRestApiCommand
} = require("@aws-sdk/client-api-gateway");

// ====== create lambdas and API gateway =====
async function APIDelete() {

	try {
		// delete the api gateway
		const apigwclient = new APIGatewayClient({});
		const data = await apigwclient.send(new GetRestApisCommand({}));
		await apigwclient.send(new DeleteRestApiCommand({restApiId: data.items[0].id}));
		console.log("Success. API Gateway deleted.");
		
		//delete the lambdas
		const lambda = new LambdaClient({});		
		await lambda.send(new DeleteFunctionCommand({FunctionName: 'providers'}));
		console.log("Success. Providers lambda deleted.");

		//delete the IAM role
		const iamclient = new IAMClient({});
		await iamclient.send(new DeleteRoleCommand({RoleName: 'healthylinkx-lambda'}));
		console.log("Success. Lambda role deleted.");
	
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIDelete;
