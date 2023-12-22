#!/bin/bash
# create the data dir for the database
mkdir data_test

# keyfile for database (see details [here](https://docs.mongodb.com/manual/tutorial/deploy-replica-set-with-keyfile-access-control/#create-a-keyfile))
touch data_test/keyfile
openssl rand -base64 756 > data_test/keyfile
chmod 400 data_test/keyfile