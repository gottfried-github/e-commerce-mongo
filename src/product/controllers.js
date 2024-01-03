import * as m from '../../../e-commerce-common/messages.js'

import {ValidationError} from '../helpers.js'

/**
    @param {fields, in Types} fields
*/
async function _create(fields, {create}) {
    let id = null
    try {
        id = await create(fields)
    } catch(e) {
        if (!(e instanceof ValidationError)) throw e

        // spec: validation failure
        throw m.ValidationError.create("mongoDB builtin validation failed", null, e.data)
    }

    // spec: success
    return id
}

/**
    @param {id, in Types} id
    @param {fields, in Types} write
    @param {Array} remove
*/
async function _update(id, {write, remove}, {update, validateObjectId, containsId}) {
    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    const idFieldName = containsId(write || {})
    
    // see Prohibiting updating `_id`
    if (idFieldName) throw m.ValidationError.create("content contains an id", {errors: [], node: {[idFieldName]: {errors: [m.FieldUnknown.create(`changing a document's id isn't allowed`)], node: null}}})

    let res = null
    try {
        res = await update(id, {write, remove})
    } catch (e) {
        if (!(e instanceof ValidationError)) throw e

        // spec: validation failure
        throw m.ValidationError.create("mongoDB builtin validation failed", null, e.data)
    }

    // spec: no document with given id
    if (null === res) throw m.InvalidCriterion.create("id must be of an existing document: no document found with given id")

    // spec: success
    return true
}

async function _addPhotos(id, photos, {addPhotos, validateObjectId}) {
    let res = null

    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    try {
        res = await addPhotos(id, photos)
    } catch(e) {
        if (e instanceof ValidationError) {
            throw m.ValidationError.create('mongoDB builtin validation failed', null, e.data)
        }

        throw e
    }

    return res
}

async function _removePhotos(productId, photosIds, {removePhotos, validateObjectId}) {
    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    const photosIdsErrors = photosIds.reduce((errors, photoId, i) => {
        const e = validateObjectId(photoId)

        if (e) errors.push({
            index: i,
            error: e
        })

        return errors
    }, [])

    if (photosIdsErrors.length) throw m.ValidationError.create("some photosIds are incorrect", null, {
        errors: photosIdsErrors
    })

    let res = null

    try {
        res = await removePhotos(productId, photosIds)
    } catch (e) {
        if (e instanceof ValidationError) throw m.ValidationError.create("mongoDB built-in validation failed", null, e)

        throw e
    }

    return res
}

async function _reorderPhotos(productId, photos, {reorderPhotos, validateObjectId}) {

}

async function _updatePhotosPublicity(productId, photos, {updatePhotosPublicity, validateObjectId}) {

}

async function _setCoverPhoto(productId, photo, {setCoverPhoto, validateObjectId}) {

}

async function _delete(id, {storeDelete, validateObjectId}) {
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
    const idE = validateObjectId(id)

    // spec: invalid id
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    // spec: success
    return getById(id)
}

async function _getMany(expose, inStock, sortOrder, {getMany}) {
    return getMany(expose, inStock, sortOrder)
}

export {
    _create,
     _update, 
    _addPhotos, 
    _removePhotos,
    _reorderPhotos,
    _updatePhotosPublicity,
    _setCoverPhoto,
    _delete, 
    _getById, 
    _getMany
}
