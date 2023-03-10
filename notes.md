# Product and Item validation
## Criteria
See `'Additional conditions' in 'Structure/Product' in e-shop docs` for what the validation should implement.

## Which errors should not occur in the data
`bazar-api` is expected to pass only the fields, defined in the specification. If any other fields are present, then we should throw (like we would, for example, if data of wrong type is passed to a function in a program).

## Which errors to report
Consider the case: `{
    isInSale: 5,
    name: 10
}`.
If `isInSale` is invalid, the document is invalid regardless whether other fields are valid or not. Does this mean that I should only report the `isInSale` error? I guess no, because if I do, the user can correct both errors and if I don't, she will need two iterations.
For the given case, should I report a `required` error on the `itemInitial`? For the field to be required, `isInSale` must be `true`. But here we don't know whether user intended it to be `true` or `false`. Thus, we don't know if `itemInitial` is ought to be `required`.
So, if `isInSale` is invalid or missing, we should report any errors regarding the other fields, except the `required` errors.

## Builtin and additional validation
In `mongodb` builtin jsonSchema validation, ["The error output ... should not be relied upon in scripts."](https://docs.mongodb.com/manual/core/schema-validation/). So if data fails builtin validation, I have to use additional validation to provide machine-readable errors.
### Some points worth noting
1. in additional validation, I only validate the fields, defined in `Structure` in `bazar-api` docs, which means I don't validate the `_id` field (if such is present in the data, it will throw)
2. in additional validation, I use a JSON-, not BSON-schema validation, which means I have to additionally BSON-validate appropriate fields
3. `mongodb` built-in validation implements `draft-4` jsonschema standard (extended to support BSON types); `ajv`, which I use in additional validation, implements `draft-7`
#### Some situations, where the points become important
1. **1, from above:** In `create`, if `fields` contain an invalid `_id`, the store will throw a validation error, which will prompt `create` to engage additional validation with the fields. First of all, the latter will throw, because `_id` is not a spec defined field.
#### Some solutions
1. **1, from above:** the solution is to separately validate `_id`, if any, before calling the store.
3. **3, from Some points worth noting:** the point is not an issue in the case of the `oneOf` keyword, since the keyword's definition hasn't changed between the two standards.

## Validating _id in additional validation
If I validate `_id`, if any, in additional validation, then the problem, described in `1` in `'Some situations, where the points become important'` goes away and I don't need the `1` solution from above.

## Machine-readable errors with ajv
### Some problems
When data violates one of the schemas in `oneOf`, errors for every schema are generated (see `~/basement/house/test/ajv_oneOf` readme).
Let's consider the case of the product schema.
1. case data: `{}`, `{isInSale: 5}` (see `empty` and `invalid`). Both these data will have:
    1. `name`: `required`
    2. `itemInitial`: `required`

We've established, in `'Which errors to report'`, that in a case like this, we don't want to report the `required` errors.
2. Additionally, with `{isInSale: true, name: 'a name'}`, `isInSale` will still have an `enum` error, from the second schema in `oneOf`.

3. `{isInSale: true, name: 5}`. This will have a `required` error for `itemInitial`.

### Some observations
Both schemas are identical except of:
    1. the value of the `enum` keyword for `isInSale`; and
    2. the `name` and `itemInitial` fields being `required`

So, whenever an error occurs, there will be identical errors for each of the schemas, except that
    1. there will be no `required` errors for `name` and `itemInitial` (because of `2` from above) from the second schema and,
    2. if `isInSale` satisfies one of the schemas, there will be no `enum` error for that schema (because of `1` from above).

### Filtering out irrelevant errors
1. In case if `isInSale` is invalid or missing: the `required` errors for the other fields are irrelevant - see `'Which errors to report'`; all the other errors will be identical for each of the schemas -- so we can
    1. ignore the `required` errors for the other fields and
    2. arbitrarily pick any schema and ignore errors from all the other ones
    3. additionally, we can ignore `enum` errors for `isInSale` (which is the only field these errors are possible for), because that keyword is used to make a logical distinction, based on which to choose schema, not to actually specify allowed values
2. If `isInSale` satisfies one of the schemas, then the schema which doesn't have the `enum` error for `isInSale` is the appropriate schema.

## Additional validation: type-validating `itemInitial` in `_validate`
An `objecId` can actually be not only a string. For example, if I pass to `validate` an `itemInitial` of an instance of `ObjectId`, it will return a type error. The same will happen for any of the other types, acceptable by `ObjectId`. To avoid this, I should not set the `string` type restriction.

## `update`, `storeGetById`: whether to validate id
Presumably, there's no docs with `objectId`-invalid ids (because store makes sure this doesn't happen during create operation). Therefore, if I don't validate the `id`, no document will be found. In such case, an error will be thrown, stating that the document the user tries to update (in case of `update`) doesn't exist, but it won't specify the reason, which, in our case is an invalid id. Following the principle, that maximally detailed information should be provided during data validation, I conclude that I should validate the id.
### do validation at the level of the store- methods
id validation has to do with specifics of mongodb, which the controllers aren't concerned with. So the validation is ought to be done at the store- level.
### do validation in a specialized method
The method encapsulates the mongodb logic and of itself provides an abstraction. Therefore it can be used in the controllers.

## Prohibiting updating `_id`
Including an `_id` in fields would modify the id of the document. If, for example, other documents reference the updated document, then we'd need to update those docs too. For now, I just don't allow to update document's id.

# `_product-validate`, `_validateBSON`: handle non-existing `itemInitial`
In `validate`, I don't check whether `itemInitial` is present in the fields before passing them to `_validateBSON`, because which fields should be validated against BSON is not the concern of `validate`: it's the concern of `_validateBSON`. Henceforth, `_validateBSON` should handle it itself. 

# getByIdRaw
The `_update` controller has to use `getByIdRaw` to additionally validate a document when it fails built-in validation, because the additional validation validates documents against a schema that corresponds to the document as it is to be saved in the database, not as it is to be aggregated on request.

# References
## Behavior of the schema, defined in the `20220409125303-product-schema.js`
See `~/basement/house/test/bazar-product-schema-mongodb` for examples of behavior for different data.

# Product testing
## Testing output separately from input
Tests are first and foremost about the *output* of a component, not necessarily about it's *input*: there could be different components taking different input and generating the same output and the output of all such components should be validated against the same code.
Of course, a concrete component has to be tested to generate specific outputs for specific inputs.
### Example
For a certain input data, both `validate` and `_validateBSON` should return a single error - a BSONTypeError - regarding `itemInitial`. But the former should return it for `{isInSale: false, itemInitial: "an invalid id"}` or alike - while the latter will return it for, say `{itemInitial: "an invalid id"}`. In both cases the output is the same, but the input is different.
Right now, `validate` doesn't pass the last two tests from `JSON-valid but BSON-invalid` because the data passed in is actually not JSON-valid.

## `_product-validate`, testing `validate`
If we've tested the dependencies, we don't need to inject fake ones to test `validate`: we just need to make sure that:
    1. if data violates JSON rules, it returns errors, that pass the same tests as errors, returned by `filterErrors` do
    2. if data violates BSON rules, the corresponding errors are the same as `validateBSON` would return
    3. if data includes fields, not defined in the spec, it throws an error

But mainly, we have to make sure that it returns proper errors for data, violating a mixture of JSON and BSON rules.

## `_product-validate`, testing `validate`: second take
`validate` is essentially a controller more than it is a validation function. So it might be that it would make more sense to test whether it calls appropriate functions in appropriate cases, rather than test whether it performs correct data validation.

## `_product-validate`, testing `_validateBSON`
The method is private, it's meant to be used by `validate`, which JSON-validate the data before passing it to the method. Henceforth, I only provide cases involving `itemInitial`. I compare the returned error (if any) with an error, generated for the same input by `mongodb` `ObjectId`.

## `_product`, testing `_update`: the order of `validateObjectId` and `containsId` doesn't matter
It doesn't matter which of the methods is called first and which is second. What matters: is that the data they return, if truthy, is thrown by `_update`, before `update` gets called. Thus, it doesn't matter whether one of the methods has been called before the other returned the truthy value.

# Auth
## `getByName`: validate name
Presumably, there's no docs with invalid names (because api makes sure this doesn't happen during create operation). Therefore, if I don't validate the `name`, no document will be found.
In the case of `getByName` this might be ok (although, it might not).
<!-- In the case of `update`, an error will be thrown, stating that the document the user tries to update doesn't exist, but it won't specify the reason, which, in our case is an invalid name. Following the principle, that maximally detailed information should be provided during data validation, I conclude that I should validate the name in the case of `update`. -->

### `create`: validate password before writing
`password` itself doesn't get stored in the db, but before it can be used to create a hash of it, which does get stored, it has to be validated: for instance, it's lenght has to be validated and it should be normalizeable. 

`name` on the other hand does get stored in the db, and undergoes builtin validation. The logic I follow regarding additional validation is to do it only if built-in validation fails. This is what I should make no exception of in this case.

### `create`: binData validation in additional validation
If I don't validate the `binData` fields in additional validation then it's possible to miss errors in the `binData` fields. E.g., if in addition to some of the `binData` fields being invalid the `name` field is invalid, built-in validation will fail and additional validation will be invoked. But if additional validation doesn't validate `binData`, then it won't report the errors and the user won't get to know that there's problems with it.

Therefore, I shall validate the `binData` fields in additional validation.The `bson` package has the `Binary` class, which I believe is what `mongdb`'s nodejs driver uses to represent the built-in `binData` type.

## Exposing password data
Should I return password data in the read methods? The current data flow between `bazar-user-mongo` and `bazar-api` is as follows: the `api` gets user data; then it calls `isCorrectPassword` with that data and the string password. The latter requires the password data.
What I could do instead is call `isCorrectPassword` directly in the `getByName` method and throw `InvalidCriterion` if it isn't.
That is what `bazar-api` spec says.

# Storing photo paths as documents
Have a single pool of photos, from which pick photos to use as demonstrations of the product and as a cover photo for it. 

I.e., keep the photos in one place and reference them from other places.

## 1. Separate collection
There's no way to reference embedded documents stored in one field from another field of the same document.

## 2. Optimizing for visitor
Have the admin choose the photos and then generate a field containing mere paths.