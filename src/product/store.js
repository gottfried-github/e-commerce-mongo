import { ObjectId } from 'bson'

import {
  ResourceNotFound,
  ValidationError as MessageValidationError,
} from '../../../e-commerce-common/messages.js'

import { ValidationError, validateObjectId } from '../helpers.js'
import { prepareFields } from './utils.js'

const VALIDATION_FAIL_MSG = 'data validation failed'

async function _storeCreate(fields, { c }) {
  if (fields.expose)
    throw new ValidationError("can't expose the product: no public photos and no cover photo")

  const fieldsPrepared = prepareFields(fields)

  let res = null

  try {
    res = await c.insertOne(fieldsPrepared)
  } catch (e) {
    // 121 is validation error: erroneous response example in https://www.mongodb.com/docs/manual/core/schema-validation/#existing-documents
    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
    throw e
  }

  return res.insertedId
}

/**
    @param {id, in Types} id
*/
async function _storeUpdate(id, { write, remove }, { product, photo }) {
  const productDoc = await product.findOne({ _id: new ObjectId(id) })

  if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

  if (write?.expose === true) {
    const photosPublic = await photo
      .find({
        productId: new ObjectId(id),
        public: true,
      })
      .toArray()

    const photoCover = await photo.findOne({
      productId: new ObjectId(id),
      cover: true,
    })

    if (!photosPublic.length || !photoCover)
      throw new ValidationError(
        "can't set expose to true: product has no public photos and/or cover photo"
      )
  }

  const query = {}
  if (write) query.$set = prepareFields(write)

  console.log('_storeUpdate, query.$set:', query.$set)

  if (remove) {
    query.$unset = {}
    remove.forEach(fieldName => (query.$unset[fieldName] = ''))
  }

  let res = null

  try {
    res = await product.updateOne({ _id: new ObjectId(id) }, query, { upsert: false })
  } catch (e) {
    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
    throw e
  }

  if (!res.matchedCount)
    throw new Error('given product found during find but not matched during update')
  if (!res.modifiedCount) return false
  // if (!res.matchedCount) throw m.ResourceNotFound.create("the given id didn't match any products")

  return true
}

async function _storeDelete(id, { client, product, photo }) {
  const session = client.startSession()

  let res = null

  try {
    res = await session.withTransaction(async () => {
      const resPhotos = await photo.deleteMany({ productId: new ObjectId(id) }, { session })
      const res = await product.deleteOne({ _id: new ObjectId(id) }, { session })

      if (!res.deletedCount) throw ResourceNotFound.create("given product doesn't exist")

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

async function _storeGetById(id, { c }) {
  const res = await c
    .aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'photo',
          localField: '_id',
          foreignField: 'productId',
          pipeline: [{ $addFields: { id: '$_id' } }],
          as: 'photos_all',
        },
      },
      {
        $lookup: {
          from: 'photo',
          localField: '_id',
          foreignField: 'productId',
          pipeline: [{ $match: { cover: true } }],
          as: 'photo_cover_lookup',
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          is_in_stock: 1,
          expose: 1,
          description: 1,
          time: 1,
          photos_all: 1,
          photo_cover: {
            $cond: {
              if: { $gt: [{ $size: '$photo_cover_lookup' }, 0] },
              then: { $arrayElemAt: ['$photo_cover_lookup', 0] },
              else: null,
            },
          },
        },
      },
      {
        $addFields: {
          photo_cover: {
            $cond: {
              if: { $eq: ['$photo_cover', null] },
              then: null,
              else: { $mergeObjects: ['$photo_cover', { id: '$photo_cover._id' }] },
            },
          },
        },
      },
    ])
    .toArray()

  return res[0]
}

async function _storeGetByIdRaw(id, { c }) {
  return c.findOne({ _id: new ObjectId(id) })
}

/**
 * @param {Boolean} expose what to match in expose field
 * @param {Boolean} inStock what to match in is_in_stock field
 * @param {Array} sortOrder sort order and sort direction for each field
 */
async function _storeGetMany(expose, inStock, sortOrder, { c }) {
  const pipeline = []

  const match = {}
  if ('boolean' === typeof expose) match.expose = expose
  if ('boolean' === typeof inStock) match.is_in_stock = inStock
  pipeline.push(
    { $match: match },
    {
      $lookup: {
        from: 'photo',
        localField: '_id',
        foreignField: 'productId',
        pipeline: [{ $addFields: { id: '$_id' } }],
        as: 'photos_all',
      },
    },
    {
      $lookup: {
        from: 'photo',
        localField: '_id',
        foreignField: 'productId',
        pipeline: [{ $match: { cover: true } }],
        as: 'photo_cover_lookup',
      },
    }
  )

  if (sortOrder) {
    const sort = {}
    for (const i of sortOrder) sort[i.name] = i.dir
    pipeline.push({ $sort: sort })
  }

  pipeline.push(
    {
      $project: {
        id: '$_id',
        name: 1,
        price: 1,
        is_in_stock: 1,
        expose: 1,
        description: 1,
        time: 1,
        photos_all: 1,
        photo_cover: {
          $cond: {
            if: { $gt: [{ $size: '$photo_cover_lookup' }, 0] },
            then: { $arrayElemAt: ['$photo_cover_lookup', 0] },
            else: null,
          },
        },
      },
    },
    {
      $addFields: {
        photo_cover: {
          $cond: {
            if: { $eq: ['$photo_cover', null] },
            then: null,
            else: { $mergeObjects: ['$photo_cover', { id: '$photo_cover._id' }] },
          },
        },
      },
    }
  )

  const res = await c.aggregate(pipeline).toArray()

  return res
}

/**
 * @param {ObjectId} id
 * @param {Array} photos photo: {
 *      pathPublic, pathLocal
 * }
 */
async function _storeAddPhotos(productId, photos, { product, photo }) {
  const productDoc = await product.findOne({ _id: new ObjectId(productId) })

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
  } catch (e) {
    // 121 is validation error: erroneous response example in https://www.mongodb.com/docs/manual/core/schema-validation/#existing-documents
    if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)

    throw e
  }

  if (res.insertedCount !== _photos.length)
    throw new Error('insertedCount is not the same as the number of given photos')

  return true
}

async function _storeRemovePhotos(productId, photoIds, { client, photo, product }) {
  const session = client.startSession()

  let res = null

  try {
    res = await session.withTransaction(async () => {
      const resDelete = await photo.deleteMany(
        {
          productId: new ObjectId(productId),
          _id: { $in: photoIds.map(id => new ObjectId(id)) },
        },
        { session }
      )

      // API should respond with 400: bad input
      if (resDelete.deletedCount < photoIds.length)
        throw ResourceNotFound.create('not all given photos belong to the given product')

      const _product = await product.findOne({ _id: new ObjectId(productId) }, { session })

      if (!_product) throw ResourceNotFound.create("given product doesn't exist")

      if (!_product.expose) return true

      const photosPublic = await photo
        .find(
          {
            productId: new ObjectId(productId),
            public: true,
          },
          { session }
        )
        .toArray()

      const photoCover = await photo.findOne(
        { productId: new ObjectId(productId), cover: true },
        { session }
      )

      if (!photosPublic.length || !photoCover) {
        const message = !photosPublic.length
          ? 'Неможливо видалити усі публічні фото із публічного продукту. Спершу приховайте продукт'
          : 'Неможливо видалити обкладинку із публічного продукту. Спершу приховайте продукт'

        throw MessageValidationError.create(message)
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

async function _storeReorderPhotos(productId, photos, { client, product, photo }) {
  const productDoc = await product.findOne({ _id: new ObjectId(productId) })

  if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

  const photosDocsMatched = await photo
    .find({
      productId: new ObjectId(productId),
      _id: { $in: photos.map(photo => photo.id).map(id => new ObjectId(id)) },
      public: true,
    })
    .toArray()

  const photosDocsAll = await photo
    .find({
      productId: new ObjectId(productId),
      public: true,
    })
    .toArray()

  // not all `photos` are public or exist in the product, or `photos` are not all public photos
  if (photosDocsMatched.length < photos.length || photosDocsAll.length > photos.length)
    throw new ValidationError(
      'must pass all public photos, relating to the given product and only the photos that relate to the given product'
    )

  const session = client.startSession()

  let res = null

  try {
    res = await session.withTransaction(async () => {
      for (const _photo of photos) {
        let res = null

        try {
          res = await photo.updateOne(
            {
              productId: new ObjectId(productId),
              public: true,
              _id: new ObjectId(_photo.id),
            },
            {
              $set: {
                order: _photo.order,
              },
            },
            { session }
          )
        } catch (e) {
          if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
          throw e
        }

        if (!res.matchedCount)
          throw ResourceNotFound.create(
            "given photo doesn't belong to the given product or isn't public"
          )
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

async function _storeUpdatePhotosPublicity(productId, photos, { client, photo, product }) {
  const session = client.startSession()

  let res = null

  try {
    res = await session.withTransaction(async () => {
      for (const _photo of photos) {
        const update = { $set: {} }

        if (_photo.public === true) {
          const _photoDoc = await photo.findOne(
            {
              productId: new ObjectId(productId),
              _id: new ObjectId(_photo.id),
            },
            { session }
          )

          if (!_photoDoc)
            throw ResourceNotFound.create(
              "a photo with given id, referencing the given product doesn't exist"
            )

          // prevent changing order of an already public photo
          if (_photoDoc.public) continue

          update.$set.public = _photo.public

          const photosDocs = await photo
            .find(
              {
                productId: new ObjectId(productId),
                public: true,
              },
              { session }
            )
            .sort('order', 1)
            .toArray()

          update.$set.order =
            photosDocs.length > 0 ? photosDocs[photosDocs.length - 1].order + 1 : 0
        } else if (_photo.public === false) {
          const _photoDoc = await photo.findOne(
            {
              productId: new ObjectId(productId),
              _id: new ObjectId(_photo.id),
            },
            { session }
          )

          if (!_photoDoc)
            throw ResourceNotFound.create(
              "a photo with given id, referencing the given product doesn't exist"
            )

          update.$set.public = false
          update.$unset = {
            order: '',
          }
        }

        let res = null

        try {
          res = await photo.updateOne(
            {
              productId: new ObjectId(productId),
              _id: new ObjectId(_photo.id),
            },
            update,
            { session }
          )
        } catch (e) {
          if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
          throw e
        }

        if (!res.matchedCount)
          throw new Error('photo found during find but not matched during update')
      }

      const _product = await product.findOne({ _id: new ObjectId(productId) }, { session })

      if (!_product.expose) return true

      const photosDocs = await photo
        .find(
          {
            productId: new ObjectId(productId),
            public: true,
          },
          { session }
        )
        .toArray()

      if (!photosDocs.length) {
        throw MessageValidationError.create(
          'Неможливо приховати усі публічні фотографії для публічного продукту. Спершу приховайте продукт'
        )
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

async function _storeSetCoverPhoto(productId, photo, { client, product, photoC }) {
  const session = client.startSession()

  let res = null

  try {
    res = await session.withTransaction(async () => {
      const productDoc = await product.findOne({ _id: new ObjectId(productId) }, { session })

      if (!productDoc) throw ResourceNotFound.create("given product doesn't exist")

      if (photo.cover === true) {
        const photoCoverPrev = await photoC.findOne(
          {
            productId: new ObjectId(productId),
            cover: true,
          },
          { session }
        )

        if (photoCoverPrev) {
          try {
            await photoC.updateOne(
              {
                _id: photoCoverPrev._id,
              },
              {
                $set: {
                  cover: false,
                },
              },
              { session }
            )
          } catch (e) {
            if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
            throw e
          }
        }

        let res = null

        try {
          res = await photoC.updateOne(
            {
              productId: new ObjectId(productId),
              _id: new ObjectId(photo.id),
            },
            {
              $set: {
                cover: true,
              },
            },
            { session }
          )
        } catch (e) {
          if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
          throw e
        }

        if (!res.matchedCount)
          throw ResourceNotFound.create("the given photo doesn't belong to the given product")

        return true
      } else if (photo.cover === false) {
        if (productDoc.expose) {
          throw MessageValidationError.create(
            'Неможливо прибрати фото із обкладинки публічного продукту. Спершу приховайте продукт.'
          )
        }

        let res = null

        try {
          res = await photoC.updateOne(
            {
              productId: new ObjectId(productId),
              _id: new ObjectId(photo.id),
            },
            {
              $set: {
                cover: false,
              },
            },
            { session }
          )
        } catch (e) {
          if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, e)
          throw e
        }

        if (!res.matchedCount)
          throw ResourceNotFound.create("given photo doesn't belong to the given product")

        return true
      } else {
        throw new Error('photo cover must be boolean')
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

async function _storeGetPhotos(productId, publicPhotos, { photo }) {
  const query = {
    productId: new ObjectId(productId),
  }

  if (typeof publicPhotos === 'boolean') query.public = publicPhotos

  const pipeline = [
    {
      $match: query,
    },
    {
      $project: {
        id: '$_id',
        productId: 1,
        pathsPublic: 1,
        pathsLocal: 1,
        public: 1,
        cover: 1,
        order: 1,
      },
    },
  ]

  if (publicPhotos || typeof publicPhotos !== 'boolean')
    pipeline.push({
      $sort: {
        order: 1,
      },
    })

  return photo.aggregate(pipeline).toArray()
}

export {
  _storeCreate,
  _storeUpdate,
  _storeAddPhotos,
  _storeRemovePhotos,
  _storeUpdatePhotosPublicity,
  _storeSetCoverPhoto,
  _storeReorderPhotos,
  _storeGetPhotos,
  _storeDelete,
  _storeGetById,
  _storeGetByIdRaw,
  _storeGetMany,
}
