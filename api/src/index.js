const constants = require("./constants.js");
const mysql = require('mysql2/promise');

function ServerReply (code, message){
	if (code != 200) message = [];
	return {
		"statusCode": code,
		"headers": {
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS,GET"
		},
		"body": '{ "Providers": ' + JSON.stringify(message) + '}'
	};
}

exports.handler = async (event) => {
	if (!event.queryStringParameters)
		return ServerReply (204, {"error": 'not params!'});

	var gender = event.queryStringParameters.gender;
	var lastname1 = event.queryStringParameters.lastname1;
	var lastname2 = event.queryStringParameters.lastname2;
	var lastname3 = event.queryStringParameters.lastname3;
	var specialty = event.queryStringParameters.specialty;
	var distance = event.queryStringParameters.distance;
	var zipcode = event.queryStringParameters.zipcode;
 	
 	//check params
 	if(!zipcode && !lastname1 && !specialty)
		return ServerReply (204, {"error": 'not enought params!'});
	
	//normalize gender
	if (gender){
		if (gender === 'male') gender = 'M';
		if (gender === 'm') gender = 'M';
		if (gender !== 'M') gender = 'F';
	}

	var query = "SELECT Provider_Full_Name,Provider_Full_Street,Provider_Full_City,Classification FROM npidata2 WHERE (";
 	if(lastname1)
 		query += "((Provider_Last_Name_Legal_Name = '" + lastname1 + "')";
 	if(lastname2)
 		query += " OR (Provider_Last_Name_Legal_Name = '" + lastname2 + "')";
 	if(lastname3)
 		query += " OR (Provider_Last_Name_Legal_Name = '" + lastname3 + "')";
 	if(lastname1)
 		query += ")";
 	if(gender)
 		if(lastname1)
 			query += " AND (Provider_Gender_Code = '" + gender + "')";
 		else
 			query += "(Provider_Gender_Code = '" + gender + "')";
 	if(specialty)
 		if(lastname1 || gender)
 			query += " AND (Classification = '" + specialty + "')";
 		else
 			query += "(Classification = '" + specialty + "')";

	if(zipcode)
		if(lastname1 || gender || specialty)
			query += " AND (Provider_Short_Postal_Code = '"+ zipcode + "')";
		else
			query += "(Provider_Short_Postal_Code = '" + zipcode + "')";
	query += ") limit 3";

	try {
		const connection = await mysql.createConnection({
			host:constants.host,
			user:constants.user,
			password:constants.password,
			database:constants.database
		});
		await connection.connect();
		const [rows,fields] = await connection.query(query);
		await connection.end();
		return ServerReply (200, rows);
	} catch(err) {
		return ServerReply (500, {"error": query + '#' + err});
	} 
}; 