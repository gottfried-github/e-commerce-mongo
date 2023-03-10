import {ObjectId} from 'bson'

import {ValidationError, validateObjectId} from '../helpers.js'

const VALIDATION_FAIL_MSG = "data validation failed"

async function _storeCreate(fields, {c}) {
    let res = null

    try {
        res = await c.insertOne(fields)
    } catch(e) {
        if (121 === e.code) e = new ValidationError(VALIDATION_FAIL_MSG, e)
        throw e
    }

    return res.insertedId
}

function _wrapPhoto(photo) {
    const e = validateObjectId(photo)
    if (e) throw new ValidationError('photo objectId is invalid', e)

    return new ObjectId(photo)
}

/**
    @param {id, in Types} id
*/
async function _storeUpdate(id, {write, remove}, {c}) {
    let res = null
    try {
        if (write?.photos) write.photos = write.photos.map(_wrapPhoto)
        if (write?.photos_all) write.photos_all = write.photos_all.map(_wrapPhoto)

        const query = {}
        if (write) query.$set = write

        if (remove) {
            query.$unset = {}
            remove.forEach(fieldName => query.$unset[fieldName] = '')
        }

        res = await c.updateOne({_id: new ObjectId(id)}, query, {upsert: false})
    } catch(e) {
        if (121 === e.code) e = new ValidationError(VALIDATION_FAIL_MSG, e)
        throw e
    }

    if (!res.matchedCount) return null
    if (!res.modifiedCount) return false
    // if (!res.matchedCount) throw m.ResourceNotFound.create("the given id didn't match any products")

    return true
}

/**
 * @param {ObjectId} id
 * @param {Array} photos array of ObjectId's
*/
async function _storeUpdatePhotos(id, photos, {c}) {
    let res = null

    try {
        res = await c.updateOne({_id: new ObjectId(id)}, {$push: {photos_all: {$each: photos}}})
    } catch (e) {
        if (121 === e.code) e = new ValidationError(VALIDATION_FAIL_MSG, e)
        throw e
    }

    if (!res.matchedCount) return null
    if (!res.modifiedCount) return false

    return true
}

async function _storeDelete(id, {c}) {
    const res = await c.deleteOne({_id: new ObjectId(id)})
    if (0 === res.deletedCount) return null
    return true
}

async function _storeGetById(id, {c}) {
    const res = await c.aggregate([
        {$match: {_id: new ObjectId(id)}},
        {$lookup: {
            from: 'photo',
            localField: 'photos_all',
            foreignField: '_id',
            as: 'photos_all'
        }},
        {$lookup: {
            from: 'photo',
            localField: 'photos',
            foreignField: '_id',
            as: 'photos'
        }},
        {$project: {
            'photos_all': {$map: {
                input: '$photos_all',
                as: 'photo',
                in: {
                    id: '$$photo._id',
                    path: '$$photo.path'
                }
            }},
            'photos': {$map: {
                input: '$photos',
                as: 'photo',
                in: {
                    id: '$$photo._id',
                    path: '$$photo.path'
                }
            }},
            name: 1,
            price: 1,
            is_in_stock: 1,
            cover_photo: 1,
            description: 1
        }}
    ]).toArray()

    return res[0]
}

async function _storeGetByIdRaw(id, {c}) {
    return c.findOne({_id: new ObjectId(id)})
}

async function _storeGetMany({c}) {
    return c.aggregate([
        {$match: {}},
        {$project: {
            id: '$_id',
            name: 1,
            price: 1,
            is_in_stock: 1,
            photos: 1,
            photos_all: 1,
            cover_photo: 1,
            description: 1
        }}
    ]).toArray()
}

export {_storeCreate, _storeUpdate, _storeUpdatePhotos, _storeDelete, _storeGetById, _storeGetByIdRaw, _storeGetMany}
