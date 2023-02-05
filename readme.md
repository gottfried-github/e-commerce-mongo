# Description
A storage layer for [e-commerce-app](). Implements specification, defined [here](e-commerce-api#store-api).

# Architecture
All the logic having to do directly with mongoDB api and query language is contained in the [`store.js` file](store.js) and in helpers such as [validateObjectId]() and [containsId](). [The controllers](controllers.js) solve logistics between the storage layer and validation.

# Validation
## Reasons for duplicate validation
Initially, I attempted to make mongoDB built-in validation machine-readable by executing duplicate validation which I wrote manually, whenever built-in validation fails. This is what is reflected in [the present code](validate.js). Now I think that this is a bad idea. Doing duplicate validation, I would have to make sure that data fails the duplicate validation for precisely the same reasons it fails built-in validation. But this is impossible to do reliably, because built-in validation failure output isn't machine-readable (which is the very reason of doing duplicate validation).

Instead, I should validate *user input* before passing it to the database and not pass invalid data to the database. Then, if invalid data still somehow gets to the database, developer should be concerned with that (because either, for some reason, the validation didn't work or parts of data with which the validation is not concerned have failed built-in validation and those parts are of developer's concern anyway).

## Data structure
The data structure is as follows:
```json
{
  expose: boolean,
  ...
}
```

The other fields in the data are conditioned on the `expose` field: if it is `true`, the other fields are required and if it's `false`, they aren't.

## Which errors to report
Consider the case: 
```json
{
    expose: 5,
    name: 10
}
```
If `expose` is invalid, the document is invalid regardless whether other fields are valid or not. Does this mean that I should only report the `expose` error? I guess no, because if I report the other error as well, the user can correct both errors and if I don't, she will need two iterations.
For the given case, should I report a `required` error on the `itemInitial`? For the field to be required, `expose` must be `true`. But here we don't know whether user intended it to be `true` or `false`. Thus, we don't know if `itemInitial` is ought to be `required`.
So, if `expose` is invalid or missing, we should report any errors regarding the other fields, except the `required` errors.

## Technicalities
When data violates one of the schemas in `oneOf`, errors for every schema are generated.
Let's consider the case of the product schema.
1. case data: `{}`, `{expose: 5}`. Both these data will have:
    1. `name`: `required`
    2. `itemInitial`: `required`

We've established, in `'Which errors to report'`, that in a case like this, we don't want to report the `required` errors.
2. Additionally, with `{expose: true, name: 'a name'}`, `expose` will still have an `enum` error, from the second schema in `oneOf`.

3. `{expose: true, name: 5}`. This will have a `required` error for `itemInitial`.

### Some observations
Both schemas are identical except of:
1. the value of the `enum` keyword for `expose`; and
2. the other fields being `required`

So, whenever an error occurs, there will be identical errors for each of the schemas, except that
1. there will be no `required` errors for the other fields (because of `2` from above) from the second schema and,
2. if `expose` satisfies one of the schemas, there will be no `enum` error for that schema (because of `1` from above).

### Filtering out irrelevant errors
[`filterErrors`](validate.js#) adheres to these principles. 
1. *In case if `expose` is invalid or missing*: the `required` errors for the other fields are irrelevant - see `'Which errors to report'`; all the other errors will be identical for each of the schemas -- so we can
    1. ignore the `required` errors for the other fields and
    2. arbitrarily pick any schema and ignore errors from all the other ones
    3. additionally, we can ignore `enum` errors for `isInSale` (which is the only field these errors are possible for), because that keyword is used to make a logical distinction, based on which to choose schema, not to actually specify allowed values
2. *If `expose` satisfies one of the schemas*, then the schema which doesn't have the `enum` error for `expose` is the appropriate schema.