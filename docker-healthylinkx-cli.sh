# check if the image is already built, if not build it
if [ "$(docker images | grep node-sql-cli)" == "" ]; then
	docker build --rm=true -t node-sql-cli $PWD/docker
fi

# similar to healthylinkx-cli.sh but running inside a container to avoid to install node, npm...
docker run -ti --rm -v $PWD:/repo \
	-w /repo/ \
	-e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_ACCOUNT_ID \
	-e AWS_REGION -e AWS_DEFAULT_REGION \
	node-sql-cli /bin/bash /repo/healthylinkx-cli.sh "$@"