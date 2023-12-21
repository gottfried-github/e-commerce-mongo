#!/bin/bash

# apply migrations
/e-commerce-mongo/node_modules/.bin/migrate-mongo up -f /e-commerce-mongo/test.migrate-mongo-config.js