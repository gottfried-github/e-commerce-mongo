# Specification
## Validation error format
`ValidationError` with `tree` being an `ajv-errors-to-data-tree`-formatted tree resembling the input data, with the errors being `ValidationError`, `FieldMissing`, `TypeErrorMsg`

## create one
### parameters
1. `fields`

### behavior
* **success**: return id of created document
* **validation failure**: throw validation error

Any other error will be treated as an internal error.

## update one
### parameters
1. `id`
2. `fields`

### behavior
* **success**: return `true`
* **invalid `id` or no document with given id**: throw `InvalidCriterion`
* **validation failure**: throw validation error

Any other error will be treated as an internal error.

## delete one
### parameters
1. `id`

### behavior
* **success**: return `true`
* **invalid `id` or no document with given id**: throw `InvalidCriterion`

Any other error will be treated as an internal error.

## getById
### parameters
1. `id`

### behavior
* **success**: return the found document
* **no document found**: return `null`
* **invalid id**: throw `InvalidCriterion`

Any other error will be treated as an internal error.
