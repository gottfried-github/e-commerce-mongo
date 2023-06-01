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