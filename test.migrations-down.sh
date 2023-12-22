#!/bin/bash

# apply migrations
/base/e-commerce-mongo/node_modules/.bin/migrate-mongo down -f /base/e-commerce-mongo/test.migrate-mongo-config.js