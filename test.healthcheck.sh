#!/bin/bash

if mongosh --quiet --eval "db.runCommand({ping: 1}).ok === 1 ? true : false" "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@base"; then exit 0; fi; exit 1