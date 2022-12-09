import Ajv from 'ajv'
import {toTree} from 'ajv-errors-to-data-tree'

const ajv = new Ajv({allErrors: true, strictRequired: true})

const _validateJSON = ajv.compile({
    type: 'object',
    properties: {
        _id: {},
        path: {
            type: 'string',
            minLength: 1,
            maxLength: 1000
        }
    },
    required: ['path'],
    additionalProperties: false
})

function _validate(fields) {
    if (_validateJSON(fields)) return null

    const errors = toTree(_validateJSON.errors, () => {
        // see Which errors should not occur in the data
        if ('additionalProperties' === e.keyword) throw new Error("data contains fields, not defined in the spec")

        if ('required' === e.keyword) return m.FieldMissing.create(e.message, e)
        if ('type' === e.keyword) return m.TypeErrorMsg.create(e.message, e)

        return m.ValidationError.create(e.message, null, e)
    })

    return errors
}

export {_validate}