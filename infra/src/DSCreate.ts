const constants = require('./envparams.ts');
const {
	RDSClient,
	CreateDBInstanceCommand,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
	EC2Client,
	CreateSecurityGroupCommand,
	AuthorizeSecurityGroupIngressCommand
} = require("@aws-sdk/client-ec2");
const unzip = require('unzip');
const fs = require('graceful-fs');
const exec = require('await-exec');

// ======== helper function ============
function sleep(secs) {
	return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

// ====== create MySQL database and add data =====
async function DSCreate() {

	try {
		//In order to have public access to the DB
		//we need to create a security group (aka firewall)with an inbound rule 
		//protocol:TCP, Port:3306, Source: Anywhere (0.0.0.0/0)
		const ec2client = new EC2Client({});
		
		var data = await ec2client.send(new CreateSecurityGroupCommand({ Description: 'MySQL Sec Group', GroupName: 'DBSecGroup'}));
		const vpcSecurityGroupId = data.GroupId;
		console.log("Success. " + vpcSecurityGroupId + " created.");
		
		const paramsIngress = {
			GroupId: data.GroupId,
			IpPermissions: [{
				IpProtocol: "tcp",
				FromPort: 3306,
				ToPort: 3306,
				IpRanges: [{ CidrIp: "0.0.0.0/0" }],
			}],
		};
		await ec2client.send( new AuthorizeSecurityGroupIngressCommand(paramsIngress));
		console.log("Success. " + vpcSecurityGroupId + " authorized.");

		// Create an RDS client service object
		const rdsclient = new RDSClient({});
	
		// Create the RDS instance
		var rdsparams = {
			AllocatedStorage: 20, 
			BackupRetentionPeriod: 0,
			DBInstanceClass: 'db.t2.micro',
			DBInstanceIdentifier: 'healthylinkx-db',
			DBName: 'healthylinkx',
			Engine: 'mysql',
			MasterUsername: constants.DBUSER,
			MasterUserPassword: constants.DBPWD,
			PubliclyAccessible: true,
			VpcSecurityGroupIds: [vpcSecurityGroupId]
		};
		await rdsclient.send(new CreateDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db requested.");

		//unzip the file to dump on the database
		// we do this here to use the wait time to unzip
		await fs.createReadStream(constants.ROOT + '/datastore/src/healthylinkxdump.sql.zip')
			.pipe(unzip.Extract({ path: constants.ROOT + '/datastore/src' }));

		//wait till the instance is created
		while(true) {
			data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
			if (data.DBInstances[0].DBInstanceStatus  === 'available') break;
			console.log("Waiting. healthylinkx-db " + data.DBInstances[0].DBInstanceStatus);
			await sleep(30);
		}
		console.log("Success. healthylinkx-db provisioned.");
	
		//URL of the instance
		data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		const endpoint = data.DBInstances[0].Endpoint.Address;
		console.log("DB endpoint: " + endpoint);

		//load the data (and schema) into the database
		// I really don't like this solution but all others I tried didn't work well => compromising!
		await exec(`mysql -u${constants.DBUSER} -p${constants.DBPWD} -h${endpoint} healthylinkx < ${constants.ROOT + '/datastore/src/healthylinkxdump.sql'}`); 
		console.log("Success. healthylinkx-db populated with data.");
				
		//cleanup. delete the unzipped file
		await fs.unlinkSync(constants.ROOT + '/datastore/src/healthylinkxdump.sql');
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSCreate;

