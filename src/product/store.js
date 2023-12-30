import {ObjectId} from 'bson'

import {ResourceNotFound} from '../../../e-commerce-common/messages.js'

import {ValidationError, validateObjectId} from '../helpers.js'

const VALIDATION_FAIL_MSG = "data validation failed"

async function _storeCreate(fields, {c}) {
    let res = null

    if (fields.time) fields.time = new Date(fields.time)
    
    try {
        res = await c.insertOne(fields)
    } catch(e) {
        // 121 is validation error: erroneous response example in https://www.mongodb.com/docs/manual/core/schema-validation/#existing-documents
        if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
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
        if (write?.time) write.time = new Date(write.time)

        const query = {}
        if (write) query.$set = write

        if (remove) {
            query.$unset = {}
            remove.forEach(fieldName => query.$unset[fieldName] = '')
        }

        res = await c.updateOne({_id: new ObjectId(id)}, query, {upsert: false})
    } catch(e) {
        if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
        throw e
    }

    if (!res.matchedCount) return null
    if (!res.modifiedCount) return false
    // if (!res.matchedCount) throw m.ResourceNotFound.create("the given id didn't match any products")

    return true
}

/**
 * @param {ObjectId} id
 * @param {Array} photos photo: {
 *      pathPublic, pathLocal
 * }
*/
async function _storeAddPhotos(id, photos, {client, photo}) {
    const _photos = photos.map(photo => ({
        ...photo,
        productId: new ObjectId(id),
        public: false,
        cover: false,
    }))

    let res = null

    try {
        res = await photo.insertMany(_photos)
    } catch(e) {
        // 121 is validation error: erroneous response example in https://www.mongodb.com/docs/manual/core/schema-validation/#existing-documents
        if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)

        throw e
    }

    if (res.insertedCount !== _photos.length) throw new Error("insertedCount is not the same as the number of given photos")

    return true
}

async function _storeRemovePhotos(productId, photoIds, {client, photo, product}) {
    const session = client.startSession()

    let res = null

    try {
        res = await session.withTransaction(async () => {
            const resDelete = await photo.deleteMany({
                productId,
                _id: {$in: photoIds.map(id => new ObjectId(id))}
            })

            // API should respond with 400: bad input
            if (resDelete.deletedCount < photoIds) throw ResourceNotFound.create("not all given photos belong to the given product")

            const _product = await product.findOne({_id: productId}, {session})

            if (!_product) throw ResourceNotFound.create("given product doesn't exist")

            if (!_product.expose) return true

            const photosPublic = await photo.find({
                productId,
                public: true
            }, {session}).toArray()

            const photoCover = await photo.findOne({productId, cover: true}, {session})

            if (!photosPublic.length || !photoCover) {
                let resProduct = null

                try {
                    await product.updateOne({_id: productId}, {
                        $set: {
                            expose: false
                        }
                    })
                } catch (e) {
                    throw e
                }

                if (!resProduct.matchedCount) throw new Error("updateOne doesn't match existing product")
                if (resProduct.modifiedCount === 0) throw new Error("product's expose field doesn't get updated")

                return true
            }

            return true
        })
    } catch (e) {
        await session.endSession()

        throw e
    }

    // for some reason, withTransaction returns an object with the `ok` property instead of the return value of the callback
    if (res.ok !== 1) {
        await session.endSession()
        
        const e = new Error('transaction completed but return value is not ok')
        e.data = res

        throw e
    }

    await session.endSession()

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
            let: {
                'photo_id': '$photos_all'
            },
            pipeline: [
                {$match: {
                    $expr: {
                        // only search docs if the local field exists
                        $cond: {
                            if: { $eq: [{ $type: "$$photo_id" }, "missing"] },
                            then: {$literal: null},
                            else: {$in: ['$_id', '$$photo_id']}
                        }
                    }
                }},
                // add a field to each matching document with index of the document in the photos_all array
                {$addFields: {
                    sort: {
                        $indexOfArray: ['$$photo_id', '$_id']
                    }
                }},
                // sort the matching documents by the added index
                {$sort: {'sort': 1}},
                // remove the field with the index
                {$addFields: {'sort': '$$REMOVE'}}
            ],
            as: 'photos_all'
        }},
        {$lookup: {
            from: 'photo',
            let: {
                'photo_id': '$photos'
            },
            pipeline: [
                {$match: {
                    $expr: {
                        $cond: {
                            if: { $eq: [{ $type: "$$photo_id" }, "missing"] },
                            then: {$literal: null},
                            else: {$in: ['$_id', '$$photo_id']}
                        }
                    }
                }},
                {$addFields: {
                    sort: {
                        $indexOfArray: ['$$photo_id', '$_id']
                    }
                }},
                {$sort: {'sort': 1}},
                {$addFields: {'sort': '$$REMOVE'}}
            ],
            as: 'photos'
        }},
        {$lookup: {
            from: 'photo',
            let: {
                'cover_photo_id': '$cover_photo'
            },
            pipeline: [
                {$match: {
                    $expr: {
                        $cond: {
                            if: { $eq: [{ $type: "$$cover_photo_id" }, "missing"] },
                            then: {$literal: null},
                            else: {$eq: ['$_id', '$$cover_photo_id']}
                        }
                    }
                }}
            ],
            as: 'cover_photo_lookup'
        }},
        {$project: {
            'photos_all': {$cond: {
                if: {$gt: [{$size: '$photos_all'}, 0]},
                then: {$map: {
                    input: '$photos_all',
                    as: 'photo',
                    in: {
                        id: '$$photo._id',
                        pathPublic: '$$photo.pathPublic',
                        pathLocal: '$$photo.pathLocal'
                    }
                }},
                else: null
            }},
            'photos': {$cond: {
                if: {$gt: [{$size: '$photos'}, 0]},
                then: {$map: {
                    input: '$photos',
                    as: 'photo',
                    in: {
                        id: '$$photo._id',
                        pathPublic: '$$photo.pathPublic',
                        pathLocal: '$$photo.pathLocal'
                    }
                }},
                else: null
            }},
            name: 1,
            price: 1,
            is_in_stock: 1,
            expose: 1,
            cover_photo: {$cond: {
                if: {$gt: [{$size: '$cover_photo_lookup'}, 0]},
                then: {
                    id: {$getField: {
                        field: {$literal: '_id'},
                        input: {$arrayElemAt: ['$cover_photo_lookup', 0]}
                    }},
                    path: {$getField: {
                        field: {$literal: 'path'},
                        input: {$arrayElemAt: ['$cover_photo_lookup', 0]}
                    }},
                },
                else: null
            }},
            description: 1,
            time: 1
        }}
    ]).toArray()

    return res[0]
}

async function _storeGetByIdRaw(id, {c}) {
    return c.findOne({_id: new ObjectId(id)})
}

/**
 * @param {Boolean} expose what to match in expose field
 * @param {Boolean} inStock what to match in is_in_stock field
 * @param {Array} sortOrder sort order and sort direction for each field
*/
async function _storeGetMany(expose, inStock, sortOrder, {c}) {
    const pipeline = []
    
    const match = {}
    if ('boolean' === typeof(expose)) match.expose = expose
    if ('boolean' === typeof(inStock)) match.is_in_stock = inStock
    pipeline.push({$match: match})

    if (sortOrder) {
        const sort = {}
        for (const i of sortOrder) sort[i.name] = i.dir
        pipeline.push({$sort: sort})
    }

    pipeline.push(
        {$lookup: {
            from: 'photo',
            let: {
                'photo_id': '$photos_all'
            },
            pipeline: [
                {$match: {
                    $expr: {
                        // only search docs if the local field exists
                        $cond: {
                            if: { $eq: [{ $type: "$$photo_id" }, "missing"] },
                            then: {$literal: null},
                            else: {$in: ['$_id', '$$photo_id']}
                        }
                    }
                }},
                // add a field to each matching document with index of the document in the photos_all array
                {$addFields: {
                    sort: {
                        $indexOfArray: ['$$photo_id', '$_id']
                    }
                }},
                // sort the matching documents by the added index
                {$sort: {'sort': 1}},
                // remove the field with the index
                {$addFields: {'sort': '$$REMOVE'}}
            ],
            as: 'photos_all'
        }},
        {$lookup: {
            from: 'photo',
            let: {
                'photo_id': '$photos'
            },
            pipeline: [
                {$match: {
                    $expr: {
                        $cond: {
                            if: { $eq: [{ $type: "$$photo_id" }, "missing"] },
                            then: {$literal: null},
                            else: {$in: ['$_id', '$$photo_id']}
                        }
                    }
                }},
                {$addFields: {
                    sort: {
                        $indexOfArray: ['$$photo_id', '$_id']
                    }
                }},
                {$sort: {'sort': 1}},
                {$addFields: {'sort': '$$REMOVE'}}
            ],
            as: 'photos'
        }},
        {$lookup: {
            from: 'photo',
            let: {
                'cover_photo_id': '$cover_photo'
            },
            pipeline: [
                {$match: {
                    $expr: {
                        $cond: {
                            if: { $eq: [{ $type: "$$cover_photo_id" }, "missing"] },
                            then: {$literal: null},
                            else: {$eq: ['$_id', '$$cover_photo_id']}
                        }
                    }
                }}
            ],
            as: 'cover_photo_lookup'
        }},
        {$project: {
            id: '$_id',
            'photos_all': {$cond: {
                if: {$gt: [{$size: '$photos_all'}, 0]},
                then: {$map: {
                    input: '$photos_all',
                    as: 'photo',
                    in: {
                        id: '$$photo._id',
                        pathPublic: '$$photo.pathPublic',
                        pathLocal: '$$photo.pathLocal'
                    }
                }},
                else: null
            }},
            'photos': {$cond: {
                if: {$gt: [{$size: '$photos'}, 0]},
                then: {$map: {
                    input: '$photos',
                    as: 'photo',
                    in: {
                        id: '$$photo._id',
                        pathPublic: '$$photo.pathPublic',
                        pathLocal: '$$photo.pathLocal'
                    }
                }},
                else: null
            }},
            name: 1,
            price: 1,
            is_in_stock: 1,
            cover_photo: {$cond: {
                if: {$gt: [{$size: '$cover_photo_lookup'}, 0]},
                then: {
                    id: {$getField: {
                        field: {$literal: '_id'},
                        input: {$arrayElemAt: ['$cover_photo_lookup', 0]}
                    }},
                    path: {$getField: {
                        field: {$literal: 'path'},
                        input: {$arrayElemAt: ['$cover_photo_lookup', 0]}
                    }},
                },
                else: null
            }},
            expose: 1,
            description: 1,
            time: 1
        }}
    )
    
    const res = await c.aggregate(pipeline).toArray()

    return res
}

export {_storeCreate, _storeUpdate, _storeAddPhotos, _storeDelete, _storeGetById, _storeGetByIdRaw, _storeGetMany}
