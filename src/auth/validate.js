import {Binary} from 'bson'
import Ajv from 'ajv'
import {toTree} from 'ajv-errors-to-data-tree'

import * as m from '../../../bazar-common/messages.js'
import {traverseTree} from 'ajv-errors-to-data-tree/src/helpers.js'

const ajv = new Ajv({allErrors: true, strictRequired: true})
const _validatePsswd = ajv.compile({
    type: "string",
    minLength: 8,
    maxLength: 150
})

const _validate = ajv.compile({
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 8,
            maxLength: 150
        },
        hash: {},
        salt: {}
    },
    required: ['name', 'hash', 'salt']
})

function validatePsswd(psswd) {
    _validatePsswd(psswd)

    if (_validatePsswd.errors) return {errors: [], node: {
        password: toTree(_validatePsswd.errors, (e) => {
            if ('type' === e.keyword) return m.TypeErrorMsg.create(e.message, e)
            if (!['minLength', 'maxLength'].includes(e.keyword)) throw new Error(`Ajv produced unpredictable error: ${e.keyword}`)
    
            return m.ValidationError.create(e.message, e)
        })
    }}

    if (psswd.normalize() !== psswd) return {errors: [], node: {
        password: {
            errors: [m.ValidationError.create('normalized version of password differs from original')],
            node: null
        }
    }}

    return null
}

function _validateBSON(fields) {
    const errors = {errors: [], node: {}}

    let hashTypeErr = null, saltTypeErr = null,
    hashEmpty = null, saltEmpty = null

    // bson.Binary handles rest of uncceptable types
    if (undefined === fields.hash || null === fields.hash) hashTypeErr = m.TypeErrorMsg.create(`hash can't be ${fields.hash}`)
    if (undefined === fields.salt || null === fields.salt) saltTypeErr = m.TypeErrorMsg.create(`salt can't be ${fields.salt}`)

    if ('' === fields.hash) hashEmpty = m.ValidationError.create(`hash cannot be empty string`)
    if ('' === fields.salt) saltEmpty = m.ValidationError.create(`salt cannot be empty string`)

    if (hashTypeErr || hashEmpty) errors.node.hash = {errors: [hashTypeErr || hashEmpty], node: null}
    if (saltTypeErr || saltEmpty) errors.node.salt = {errors: [saltTypeErr || saltEmpty], node: null}

    if (hashTypeErr && (saltTypeErr || saltEmpty) || hashEmpty && (saltTypeErr || saltEmpty)) return errors

    let hashBinErr = false, saltBinErr = false

    try {
        new Binary(fields.hash)
    } catch(e) {
        hashBinErr = e
    }

    try {
        new Binary(fields.salt)
    } catch(e) {
        saltBinErr = e
    }

    if (hashBinErr) {
        if (!('hash' in errors.node)) errors.node.hash = {errors: [], node: null}

        errors.node.hash.errors.push(m.ValidationError.create(`hash is invalid binData`, hashBinErr))
    }

    if (saltBinErr) {
        if (!('hash' in errors.node)) errors.node.hash = {errors: [], node: null}

        errors.node.hash.errors.push(m.ValidationError.create(`salt is invalid binData`, hashBinErr))
    }

    if (!hashBinErr && !saltBinErr) return null
    return errors
}

function validate(fields, {validate, validateBSON, toTree}) {
    if (validate(fields)) {
        return validateBSON(fields)
    }

    const errors = toTree(_validate.errors, (e) => {
        // see Which errors should not occur in the data
        if ('additionalProperties' === e.keyword) throw new Error("data contains fields, not defined in the spec")

        if ('required' === e.keyword) return m.FieldMissing.create(e.message, e)
        if ('type' === e.keyword) return m.TypeErrorMsg.create(e.message, e)

        return m.ValidationError.create(e.message, e)
    })

    // pointless to BSON-validate the fields if they're already invalid (if they are, it must be because they're missing)
    if (errors.node.hash?.errors.length && errors.node.salt?.errors.length) return errors

    const bsonErrors = validateBSON(fields)

    if (null === bsonErrors) return errors

    if ('hash' in bsonErrors.node) {
        if (!('hash' in errors.node)) errors.node.hash = {errors: [], node: null}

        errors.node.hash.errors.push(...bsonErrors.node.hash.errors)
    }

    if ('salt' in bsonErrors.node) {
        if (!('salt' in errors.node)) errors.node.salt = {errors: [], node: null}

        errors.node.salt.errors.push(...bsonErrors.node.salt.errors)
    }

    return errors
}

export {validatePsswd, validate, _validate, _validateBSON}

