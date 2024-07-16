import { MongoClient, ObjectId } from 'mongodb'
import { assert } from 'chai'

import { ResourceNotFound } from '../../../../e-commerce-common/messages.js'
import { _storeDelete } from '../../../src/product/store.js'

export default function productDelete() {
  describe('delete product', () => {
    describe('passed non-existent product id', () => {
      it('throws ResourceNotFound', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        try {
          await _storeDelete(new ObjectId(), { client, product, photo })
        } catch (e) {
          await client.close()

          console.log('_storeDelete threw, error:', e)
          return assert(ResourceNotFound.code === e.code)
        }

        await client.close()
        assert.fail("didn't throw")
      })
    })

    describe('passed an existing product id without any related photos', () => {
      it('deletes the product and returns true', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProductCreate = await product.insertOne({ expose: false })

        let res = null

        try {
          res = await _storeDelete(resProductCreate.insertedId, { client, product, photo })
        } catch (e) {
          await client.close()

          console.log('_storeDelete threw, error:', e)
          return assert.fail(e)
        }

        const resProductFind = await product.findOne({ _id: resProductCreate.insertedId })

        await client.close()

        assert(
          resProductFind === null && res === true,
          'either product is not deleted or response is not true'
        )
      })
    })

    describe('passed an existing product id with existing related photos', () => {
      it('deletes the photos, deletes the product and returns true', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProductCreate = await product.insertOne({ expose: false })

        const photos = [
          {
            productId: resProductCreate.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: true,
            order: 0,
            cover: false,
          },
          {
            productId: resProductCreate.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: true,
            order: 1,
            cover: true,
          },
          {
            productId: resProductCreate.insertedId,
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: false,
            cover: false,
          },
        ]

        const resPhotosCreate = await photo.insertMany(photos)

        let res = null

        try {
          res = await _storeDelete(resProductCreate.insertedId, { client, product, photo })
        } catch (e) {
          await client.close()

          console.log('_storeDelete threw, error:', e)
          return assert.fail(e)
        }

        const photosIds = Object.keys(resPhotosCreate.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotosCreate.insertedIds[index]
          return ids
        }, [])

        const resProductFind = await product.findOne({ _id: resProductCreate.insertedId })
        const resPhotosFind = await photo
          .find({
            _id: { $in: photosIds },
          })
          .toArray()

        await client.close()

        assert(
          resProductFind === null && !resPhotosFind.length && res === true,
          'either product or photos are not deleted or response is not true'
        )
      })
    })
  })
}
