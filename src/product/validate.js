import Ajv from 'ajv'
import {ObjectId} from 'mongodb'

import {toTree} from 'ajv-errors-to-data-tree'
import {traverseTree} from 'ajv-errors-to-data-tree/src/helpers.js'

import * as m from '../../../bazar-common/messages.js'

import {_parseFirstOneOfItemPath} from '../helpers.js'

const ajv = new Ajv({allErrors: true, strictRequired: true})

const otherProps = {
    _id: {},
    name: {
        type: "string"
    },
    // see Additional validation: type-validating `itemInitial` in `_validate`
    itemInitial: {}
}

const schema = {
    oneOf: [
        {
            type: "object",
            properties: {
                isInSale: {
                    type: "boolean",
                    enum: [true]
                },
                ...otherProps,
            },
            required: ["isInSale", "name", "itemInitial"],
            additionalProperties: false
        },
        {
            type: "object",
            properties: {
                isInSale: {
                    type: "boolean",
                    enum: [false]
                },
                ...otherProps,
            },
            required: ["isInSale"],
            additionalProperties: false
        }
    ]
}
const _validate = ajv.compile(schema)

function filterErrors(errors) {
    // 1, 1.2 in Filtering out irrelevant errors
    const isInSaleErr = errors.node.isInSale?.errors.find(e => 'required' === e.data.keyword || 'type' === e.data.keyword)

    if (isInSaleErr) {
        traverseTree(errors, (e, fieldname) => {
            // 1.1, 1.2, 1.3 in Filtering out irrelevant errors
            if (_parseFirstOneOfItemPath(isInSaleErr.data.schemaPath) === _parseFirstOneOfItemPath(e.data.schemaPath) || 'required' === e.data.keyword && 'isInSale' !== fieldname || 'enum' === e.data.keyword) return null
        })

        return
    }

    // 2 in Filtering out irrelevant errors

    const redundantSchemas = []

    // store the schema of the 'enum' error
    traverseTree(errors, (e) => {
        if ('enum' === e.data.keyword) redundantSchemas.push(e.data.schemaPath)
    })

    const redundantOneOfSchemas = redundantSchemas.map(v => _parseFirstOneOfItemPath(v))

    // console.log("filterErrors, redundantSchemas:", redundantSchemas, JSON.stringify(errors, null, 2));

    // exclude the schemas that have the 'enum' error
    traverseTree(errors, (e) => {
        if (redundantOneOfSchemas.includes(_parseFirstOneOfItemPath(e.data.schemaPath))) return null
    })

    return
}

function _validateBSON(fields) {
    // see `_product-validate`, `_validateBSON`: handle non-existing 
    if (!('_id' in fields) && !('itemInitial' in fields)) return null

    const errors = {errors: [], node: {}}

    if ('_id' in fields) {
        try {
            new ObjectId(fields._id)
        } catch(e) {
            errors.node._id = {errors: [e], node: null}
        }
    }

    if ('itemInitial' in fields) {
        try {
            new ObjectId(fields.itemInitial)
        } catch(e) {
            errors.node.itemInitial = {errors: [e], node: null}
        }
    }

    if (errors.node._id || errors.node.itemInitial) return errors

    return null
}

function validate(fields) {
    if (_validate(fields)) {
        return _validateBSON(fields)
    }

    const errors = toTree(_validate.errors, (e) => {
        // console.log("toTree, cb - e:", e);

        // see Which errors should not occur in the data
        if ('additionalProperties' === e.keyword) throw new Error("data contains fields, not defined in the spec")

        if ('required' === e.keyword) return m.FieldMissing.create(e.message, e)
        if ('type' === e.keyword) return m.TypeErrorMsg.create(e.message, e)

        return m.ValidationError.create(e.message, e)
    })

    filterErrors(errors)

    // there could be a 'required' error for itemInitial; there couldn't be any error for _id
    if (errors.node.itemInitial) return errors

    const bsonErrors = _validateBSON(fields)
    if (bsonErrors) {
        if (bsonErrors.node._id) {
            errors.node._id = {
                errors: [m.ValidationError.create(bsonErrors.node._id.errors[0].message, bsonErrors.node._id.errors[0])],
                node: null,
            }
        }

        if (bsonErrors.node.itemInitial) {
            errors.node.itemInitial = {
                errors: [m.ValidationError.create(bsonErrors.node.itemInitial.errors[0].message, bsonErrors.node.itemInitial.errors[0])],
                node: null,
            }
        }
    }

    return errors
}

export {
    validate,
    _validateBSON,
    filterErrors, _validate
}
