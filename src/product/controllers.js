import * as m from '../../../fi-common/messages.js'

import {ValidationError, ValidationConflict} from '../helpers.js'

const VALIDATION_CONFLICT_MSG = "mongodb validation fails while model level validation succeeds"

/**
    @param {fields, in Types} fields
*/
async function _create(fields, {create, validate}) {
    let id = null
    try {
        id = await create(fields)
    } catch(e) {
        if (!(e instanceof ValidationError)) throw e

        const errors = validate(fields)

        if (!errors) throw new ValidationConflict(VALIDATION_CONFLICT_MSG, {builtin: e})

        // spec: validation failure
        throw m.ValidationError.create("some fields are filled incorrectly", errors)
    }

    // spec: success
    return id
}

/**
    @param {id, in Types} id
    @param {fields, in Types} write
    @param {Array} remove
*/
async function _update(id, {write, remove}, {update, getById, validate, validateObjectId, containsId}) {
    // see do validation in a specialized method
    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    // see do validation in a specialized method
    const idFieldName = containsId(write || {})
    
    // see Prohibiting updating `_id`
    if (idFieldName) throw {errors: [], node: {[idFieldName]: {errors: [m.FieldUnknown.create(`changing a document's id isn't allowed`)], node: null}}}

    let res = null
    try {
        res = await update(id, {write, remove})
    } catch (e) {
        // 121 is validation error: erroneous response example in https://www.mongodb.com/docs/manual/core/schema-validation/#existing-documents
        if (!(e instanceof ValidationError)) throw e

        // do additional validation only if builtin validation fails. See mongodb with bsonschema: is additional data validation necessary?
        const doc = await getById(id)
        if (remove?.length) remove.forEach(fieldName => delete doc[fieldName])

        const errors = validate(Object.assign(doc, write || {}))

        if (!errors) throw new ValidationConflict(VALIDATION_CONFLICT_MSG, {builtin: e})

        // spec: validation failure
        throw m.ValidationError.create("some fields are filled incorrectly", errors)
    }

    // spec: no document with given id
    if (null === res) throw m.InvalidCriterion.create("id must be of an existing document: no document found with given id")

    // spec: success
    return true
}

async function _updatePhotos(id, photos, {updatePhotos, validate, validateObjectId}) {
    let res = null

    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    try {
        res = await updatePhotos(id, photos)
    } catch(e) {
        if (e instanceof ValidationError) {
            const errors = validate({photos_all: photos})

            if (!errors) throw new ValidationConflict()

            throw m.ValidationError.create('some photos are invalid', errors)
        }

        throw e
    }

    return res
}

async function _delete(id, {storeDelete, validateObjectId}) {
    // see do validation in a specialized method
    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    const res = await storeDelete(id)

    // spec: no document with given id
    if (null === res) throw m.InvalidCriterion.create("id must be of an existing document: no document found with given id")

    // spec: success
    return true
}

/**
    @param {id, in Types} id
*/
async function _getById(id, {getById, validateObjectId}) {
    // see do validation in a specialized method
    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    // spec: success
    return getById(id)
}

async function _getMany({getMany}) {
    return getMany()
}

export {_create, _update, _updatePhotos, _delete, _getById, _getMany}
