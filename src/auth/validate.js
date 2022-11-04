import Ajv from 'ajv'

import {toTree} from 'ajv-errors-to-data-tree'
import {traverseTree} from 'ajv-errors-to-data-tree/src/helpers.js'

const ajv = new Ajv({allErrors: true, strictRequired: true})
const _validatePsswd = ajv.compile({
    type: "string",
    minLength: 8,
    maxLength: 150
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

const _credentials = ajv.compile({
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 8,
            maxLength: 150
        },
        password: {
            type: "string",
            minLength: 8,
            maxLength: 150
        },
    },
    required: ['name', 'password'],
    additionalProperties: false
})

function credentials(fields) {
    _validate(fields)
    const normalizationError = password.normalize() === password

    if (!_validate.errors && !normalizationError) return null

    if (!_validate.errors) return {
        errors: [],
        node: {
            password: {
                errors: [m.ValidationError.create("password different after normalization")],
                node: null
            }
        }
    }

    const errors = toTree(_validate.errors, (e) => {
        // console.log("toTree, cb - e:", e);

        // see Which errors should not occur in the data
        if ('additionalProperties' === e.keyword) throw new Error("data contains fields, not defined in the spec")

        if ('required' === e.keyword) return m.FieldMissing.create(e.message, e)
        if ('type' === e.keyword) return m.TypeErrorMsg.create(e.message, e)

        return m.ValidationError.create(e.message, e)
    })

    if (!normalizationError) return errors

    if (!errors.node.password) errors.node.password = {node: null, errors: []}
    errors.node.password.errors.push(m.ValidationError.create("password is different after normalization"))

    return errors
}
