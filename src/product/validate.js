import Ajv from 'ajv'
import {ObjectId} from 'mongodb'

import {toTree} from 'ajv-errors-to-data-tree'
import {traverseTree} from 'ajv-errors-to-data-tree/src/helpers.js'

import * as m from '../../../fi-common/messages.js'

import {_parseFirstOneOfItemPath, validateObjectId} from '../helpers.js'

const ajv = new Ajv({allErrors: true, strictRequired: true})

const rest = {
    _id: {},
    name: {type: "string", minLength: 3, maxLength: 150},
    price: {type: "number", minimum: 0, maximum: 1000000},
    is_in_stock: {type: "boolean"},
    photos_all: {type: "array", maxItems: 500, minItems: 1, items: {}},
    photos: {type: "array", maxItems: 150, minItems: 1, items: {}},
    cover_photo: {},
    description: {type: "string", minLength: 1, maxLength: 15000}
}

const schema = {
    oneOf: [
        {
            type: "object",
            properties: {
                expose: {type: "boolean", enum: [true]},
                ...rest
            },
            required: ['expose', 'name', 'price', 'is_in_stock', 'photos', 'cover_photo', 'description'],
            additionalProperties: false
        },
        {
            type: "object",
            properties: {
                expose: {type: "boolean", enum: [false]},
                ...rest,
            },
            required: ['expose'],
            additionalProperties: false
        }
    ]
}
const _validate = ajv.compile(schema)

function filterErrors(errors) {
    // 1, 1.2 in Filtering out irrelevant errors
    const exposeErr = errors.node.expose?.errors.find(e => 'required' === e.data.keyword || 'type' === e.data.keyword)

    if (exposeErr) {
        traverseTree(errors, (e, fieldname) => {
            // 1.1, 1.2, 1.3 in Filtering out irrelevant errors
            if (_parseFirstOneOfItemPath(exposeErr.data.schemaPath) === _parseFirstOneOfItemPath(e.data.schemaPath) || 'required' === e.data.keyword && 'expose' !== fieldname || 'enum' === e.data.keyword) return null
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
    const errors = {errors: [], node: {}}

    for (const [photo, i] of fields.photos_all.entries()) {
        const e = validateObjectId(photo)
        if (!e) continue

        if (!errors.node.photos_all) errors.node.photos_all = {errors: [], node: []}
        
        errors.node.photos_all.node.push({
            errors: [m.ValidationError.create('invalid objectId', e)], index: i, node: null
        })
    }
    
    for (const [photo, i] of fields.photos.entries()) {
        const e = validateObjectId(photo)
        if (!e) continue

        if (!errors.node.photos) errors.node.photos = {errors: [], node: []}
        
        errors.node.photos.node.push({
            errors: [m.ValidationError.create('invalid objectId', e)], index: i, node: null
        })
    }

    const e = validateObjectId(fields.cover_photo)
    if (e) {
        errors.node.cover_photo = {errors: [m.ValidationError.create('invalid objectId', e)], node: null}
    }

    if (Object.keys(errors.node).length) return errors
    return null
}

function validate(fields, {validateBSON}) {
    if (_validate(fields)) return null

    const errors = toTree(_validate.errors, (e) => {
        // console.log("toTree, cb - e:", e);

        // see Which errors should not occur in the data
        if ('additionalProperties' === e.keyword) throw new Error("data contains fields, not defined in the spec")

        if ('required' === e.keyword) return m.FieldMissing.create(e.message, e)
        if ('type' === e.keyword) return m.TypeErrorMsg.create(e.message, e)

        return m.ValidationError.create(e.message, e)
    })

    filterErrors(errors)

    const bsonErrors = validateBSON(fields)
    if (bsonErrors) mergeErrors(errors, bsonErrors)

    return errors
}

export {
    _validate, filterErrors, _validateBSON, validate,
     
}
