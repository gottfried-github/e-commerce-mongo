#!/bin/bash

# apply migrations
/e-commerce-mongo/node_modules/.bin/migrate-mongo down -f /e-commerce-mongo/test.migrate-mongo-config.js