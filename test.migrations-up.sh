#!/bin/bash

# apply migrations
/base/e-commerce-mongo/node_modules/.bin/migrate-mongo up -f /base/e-commerce-mongo/test.migrate-mongo-config.js