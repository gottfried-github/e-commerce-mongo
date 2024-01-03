import {ObjectId} from 'bson'

import {ResourceNotFound} from '../../../e-commerce-common/messages.js'

import {ValidationError, validateObjectId} from '../helpers.js'

const VALIDATION_FAIL_MSG = "data validation failed"

async function _storeCreate(fields, {c}) {
    if (fields.expose) throw new ValidationError("can't expose the product: no public photos and no cover photo")
    if (fields.time) fields.time = new Date(fields.time)
    
    let res = null
    
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
async function _storeUpdate(id, {write, remove}, {product, photo}) {
    const productDoc = await product.findOne({_id: new ObjectId(id)})

    if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

    if (write?.expose === true) {
        const photosPublic = await photo.find({
            productId: new ObjectId(id),
            public: true
        }).toArray()

        const photoCover = await photo.findOne({
            productId: new ObjectId(id),
            cover: true
        })

        if (!photosPublic.length || !photoCover) throw new ValidationError("can't set expose to true: product has no public photos and/or cover photo")
    }

    if (write?.time) write.time = new Date(write.time)

    const query = {}
    if (write) query.$set = write

    if (remove) {
        query.$unset = {}
        remove.forEach(fieldName => query.$unset[fieldName] = '')
    }

    let res = null
    
    try {
        res = await product.updateOne({_id: new ObjectId(id)}, query, {upsert: false})
    } catch(e) {
        if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
        throw e
    }

    if (!res.matchedCount) throw new Error("given product found during find but not matched during update")
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
async function _storeAddPhotos(productId, photos, {product, photo}) {
    const productDoc = await product.findOne({_id: new ObjectId(productId)})

    if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

    const _photos = photos.map(photo => ({
        ...photo,
        productId: new ObjectId(productId),
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
            }, {session})

            // API should respond with 400: bad input
            if (resDelete.deletedCount < photoIds.length) throw ResourceNotFound.create("not all given photos belong to the given product")

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
                    resProduct = await product.updateOne({_id: productId}, {
                        $set: {
                            expose: false
                        }
                    }, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
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

async function _storeReorderPhotos(productId, photos, {client, product, photo}) {
    const productDoc = await product.findOne({_id: new ObjectId(productId)})

    if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

    const photosDocs = await photo.find({
        productId: new ObjectId(productId),
        public: true,
    }).toArray()

    if (photosDocs.length !== photos.length) throw new ValidationError("must pass all photos, relating to the given product and only the photos that relate to the given product")

    const session = client.startSession()

    let res = null

    try {
        res = await session.withTransaction(async () => {
            for (const _photo of photos) {
                let res = null

                try {
                    res = await photo.updateOne({
                        productId: new ObjectId(productId),
                        public: true,
                        _id: new ObjectId(_photo.id),
                    }, {
                        $set: {
                            order: _photo.order
                        }
                    }, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                    throw e
                }

                if (!res.matchedCount) throw ResourceNotFound.create("given photo doesn't belong to the given product or isn't public")
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

async function _storeUpdatePhotosPublicity(productId, photos, {client, photo, product}) {
    const session = client.startSession()
    
    let res = null

    try {
        res = await session.withTransaction(async () => {
            for (const _photo of photos) {
                const update = {$set: {}}

                if (_photo.public === true) {
                    const _photoDoc = await photo.findOne({
                        productId: new ObjectId(productId),
                        _id: new ObjectId(_photo.id)
                    }, {session})

                    if (!_photoDoc) throw ResourceNotFound.create("a photo with given id, referencing the given product doesn't exist")

                    // prevent changing order of an already public photo
                    if (_photoDoc.public) continue

                    update.$set.public = _photo.public

                    const photosDocs = await photo.find({
                        productId: new ObjectId(productId),
                        public: true
                    }, {session})
                        .sort('order', 1)
                        .toArray()

                    update.$set.order = photosDocs.length > 0
                        ? photosDocs[photosDocs.length - 1].order + 1
                        : 0

                } else if (_photo.public === false) {
                    const _photoDoc = await photo.findOne({
                        productId: new ObjectId(productId),
                        _id: new ObjectId(_photo.id)
                    }, {session})

                    if (!_photoDoc) throw ResourceNotFound.create("a photo with given id, referencing the given product doesn't exist")

                    update.$set.public = false
                    update.$unset = {
                        order: ''
                    }
                }

                let res = null

                try {
                    res = await photo.updateOne({
                        productId: new ObjectId(productId),
                        _id: new ObjectId(_photo.id)
                    }, update, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                    throw e
                }

                if (!res.matchedCount) throw new Error("photo found during find but not matched during update")
            }

            const photosDocs = await photo.find({
                productId: new ObjectId(productId),
                public: true
            }, {session}).toArray()

            if (!photosDocs.length) {
                try {
                    await product.updateOne({
                        _id: new ObjectId(productId)
                    }, {
                        $set: {
                            expose: false
                        }
                    }, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                    throw e
                }
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

async function _storeSetCoverPhoto(productId, photo, {client, product, photoC}) {
    const session = client.startSession()
    
    let res = null

    try {
        res = await session.withTransaction(async () => {
            const productDoc = await product.findOne({_id: productId}, {session})

            if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

            if (photo.cover === true) {
                const photoCoverPrev = await photoC.findOne({
                    productId: new ObjectId(productId),
                    cover: true
                }, {session})

                if (photoCoverPrev) {
                    try {
                        await photoC.updateOne({
                            _id: photoCoverPrev._id
                        }, {
                            $set: {
                                cover: false
                            }
                        }, {session})
                    } catch (e) {
                        if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                        throw e
                    }
                }

                let res = null

                try {
                    res = await photoC.updateOne({
                        productId: new ObjectId(productId),
                        _id: new ObjectId(photo.id)
                    }, {
                        $set: {
                            cover: true
                        }
                    }, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                    throw e
                }

                if (!res.matchedCount) throw ResourceNotFound.create("the given photo doesn't belong to the given product")

                return true
            } else if (photo.cover === false) {
                let res = null

                try {
                    res = await photoC.updateOne({
                        productId: new ObjectId(productId),
                        _id: new ObjectId(photo.id)
                    }, {
                        $set: {
                            cover: false
                        }
                    }, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                    throw e
                }

                if (!res.matchedCount) throw ResourceNotFound.create("given photo doesn't belong to the given product")

                if (!productDoc.expose) return true

                let resProduct = null

                try {
                    resProduct = await product.updateOne({
                        _id: new ObjectId(productId)
                    }, {
                        $set: {
                            expose: false
                        }
                    }, {session})
                } catch (e) {
                    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
                    throw e
                }

                if (!resProduct.matchedCount) throw new Error("product found during find but not matched during update")
                return true
            } else {
                throw new Error("photo cover must be boolean")
            }
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
        {$project: {
            name: 1,
            price: 1,
            is_in_stock: 1,
            expose: 1,
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
        {$project: {
            id: '$_id',
            name: 1,
            price: 1,
            is_in_stock: 1,
            expose: 1,
            description: 1,
            time: 1
        }}
    )
    
    const res = await c.aggregate(pipeline).toArray()

    return res
}

export {
    _storeCreate, 
    _storeUpdate, 
    _storeAddPhotos, 
    _storeRemovePhotos, 
    _storeUpdatePhotosPublicity,
    _storeSetCoverPhoto,
    _storeReorderPhotos,
    _storeDelete, 
    _storeGetById, 
    _storeGetByIdRaw, 
    _storeGetMany
}
