# healthylinkx-chatgpt-plugin

DISCLAIMER: I'VE BEEN WAITING ~8 WEEKS TO GET ACCESS TO CHATGPT PLUGIN DEVELOPMENT PROGRAM BUT STILL IN THE WAITLIST. I'LL UPDATE THIS README AS SOON AS I'M ACCEPTED AND I'LL SHARE RESULTS.\
UPDATE: During OpenAI Dev Day (11/6/23) OpenAI announced they are stopping supporting plugins and a new GPT model and store.

Healthylinkx helps you find doctors with the help of your social network. Think of Healthylinkx as a combination of Yelp, Linkedin and Facebook.

This is an early prototype that combines open data of doctors and specialists from the US Department of Health. It allows you to search for doctors based on location, specialization, genre or name. You can choose up to three doctors in the result list and Healthylinkx (theoretically) will book appointments for you.

Healthylinx is a classic three tiers app: front-end (ux), service API and data store. This architecture makes it very adequate to test different technologies and I use it for getting my hands dirty on new stuff. Enjoy!

This repo implements Healthylinkx using a chatgpt plugin as the front end. The idea is that you can have a conversation style using chatGPT and the LLM will call Healthylinkx API to obtain doctor's results... ChatGPT will also format the output and keep/end the conversation.

For each tier of the app, we use different AWS resources: RDS for the datastore, Lambda for the API and ChatGPT for the front-end.

To know more about the datastore this repo has more details https://github.com/mulargui/healthylinkx-mysql.git \
Likewise about the API using Lambda https://github.com/mulargui/healthylinkx-serverless.git

This repo is based and adapted from previous work to build an AWS Lex bot for healthylinkx https://github.com/mulargui/healthylinkx-lex.git

The healthylinkx-cli.sh shellscript allows you to create, update or delete any of the three tiers of the app in AWS. To work you need to have installed locally npm, nodejs and mysql-client. To make things easier, there is a docker-healthylinkx-cli.sh shellscript that creates a docker image with these components. In this case you only need to have docker locally.

In order to access AWS you need to have environment variables with your account secrets. Use something like
export AWS_ACCESS_KEY_ID=1234567890 \
export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLMN \
export AWS_ACCOUNT_ID=1234567890 \
export AWS_DEFAULT_REGION=us-east-1 \
export AWS_REGION=$AWS_DEFAULT_REGION 

Directories and files \
healthylinkx-cli.sh - this is the command line interface \
docker-healthylinkx-cli.sh - likewise but using docker \
/infra/src - healthylinkx-cli app source code to install, uninstall and update the whole app \
/infra/src/envparams.ts - All the parameters of the app, like datastore, password... Fill in your data and save it before proceeding if you want to change the default values. \
/docker - dockerfile of the container

The API is implemented as a lambda written in nodejs. \
/api/src - source code of the Lambda (node js) \
/api/test - shellscript to test the api. Before using it you need to edit and update the URL of the API.

The datastore is a RDS MySql instance and healthylinkx-cli creates the instance and uploads the data \
/datastore/data - dump of the healthylinkx database (schema and data)

The ux is a chatgpt plugin. \
/chatgpt/src contains the different files needed to register a chatgpt plugin. Read the openai documentation for more details. \
/chatgpt/test - test the api using a local proxy \
/chatgpt/test/main.py implements a local proxy to test the plugin. You need to edit and update the API url. 

Have fun using this repo!
