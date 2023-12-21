# Description
A storage layer for the [e-commerce project](https://github.com/gottfried-github/e-commerce-app). Implements specification, defined [here](https://github.com/gottfried-github/e-commerce-api#store-api).

# Architecture
All the logic having to do directly with mongoDB api and query language is contained in the [`store.js`](/src/product/store.js) files and in helpers such as [validateObjectId](https://github.com/gottfried-github/e-commerce-mongo/blob/7504297e2251e9521820cb6722d9a3132c805f05/src/helpers.js#L30) and [containsId](https://github.com/gottfried-github/e-commerce-mongo/blob/7504297e2251e9521820cb6722d9a3132c805f05/src/helpers.js#L43). The [controllers](/src/product/controllers.js) solve logistics between the storage layer and id validation and map the output of storage to the output interface.

# Tests
All the controllers are unit tested as well as the validation functions.

Test product controllers: `npm run test:product-controllers`

Test authentication controllers: `npm run test:auth-controllers`

Test product photos controllers: `npm run test:photo`

# Specification
## Product and photos
A `product` has photos, associated with it. These are stored as documents in a separate collection - `Photos` - and referenced from a `product`.

1. there should be no documents in `Photos` which are not referenced from a `product`
2. there should be no references in a `product` for which there is no documents in `Photos`

## `_storeGetMany`
### `expose` and `inStock`
If `Boolean`, matches the corresponding value in the documents. Else, matches all values.

### `sortOrder`
```json
{
    name: String,
    dir: Number
}
```

If falsy, doesn't apply the `$sort` stage. Otherwise, applies the stage according to the specified order and directions.

# Implementation
## Product and photos
### Satisfying the specification
1. Let's consider a scenario, where when adding photos, writing to `Photos` succeeds but updating the `product` fails. Now we're left in a situation, which violates `1` from [Product and photos](#product-and-photos).

2. Another scenario is: when removing photos, removing them from `Photos` succeeds but removing the references from the `product` or removing the product fails. Now we're left in a situation, which violates `2` from [Product and photos](#product-and-photos), `3` from [Relation between database and files](#relation-between-database-and-files), potentially - `4` from [Relation between database and files](#relation-between-database-and-files) and `5` from [Relation between database and files](#relation-between-database-and-files).

### Transactions
Transactions solve both `1` and `2` from above.

1. When the update to `product` fails, the write to `Photos` gets reversed.

2. Again, when the update or delete of `product` fails, the remove operation on `Photos` gets reversed.

# Testing
To set up testing environment, follow these instructions.

## 1. Preparations
If you have the `data_test` directory, then skip this step.

`./test.init.sh`

## 2. Init database
If you have already run this command in the past, then skip this step.

`docker compose -f test.init-db.docker-compose.yml up --build`

Wait a few moments to make sure the script has connected to the database and initialized it (you should see `mongosh` logs from the `init` container in the stdout). Then you can interrupt (`CTRL+c`).

## 3. Execute migrations (up)
### Prepare `package.json`
Temporarily remove the `"type": "module"` declaration from `package.json` [`1`].

### Run the commands
1. `docker compose -f test.run.docker-compose.yml run bash`

Inside the running container:

2. `/e-commerce-mongo/test.migrations-up.sh`

### Undo changes to `package.json`
Put the `"type": "module"` declaration back into `package.json`

## 4. Run the tests
If you have the container running from `1` in the previous section, then skip this step:

1. `docker compose -f test.run.docker-compose.yml run bash`

Inside the running container:

2. `npm run test:db`

## 5. After testing, clean up the environment
We need to unwind the migrations. We're going to use `migrate-mongo`, so we need to temporarily remove the `"type": "module"` declaration from `package.json` again, as we did in [`2`](2.-init-database).

Now, if you have the container running from the [previous steps](4.-run-the-tests), you can skip this step:

1. `docker compose -f test.run.docker-compose.yml run bash`

Inside the running container, run:

`/e-commerce-mongo/test.migrations-down.sh`

# Notes
1. `migrate-mongo`, which is run in `test.migrations-up.sh`, doesn't work with es6 modules.