import { MongoClient, ObjectId } from 'mongodb'
import { assert } from 'chai'

import { ResourceNotFound, ValidationError } from '../../../../e-commerce-common/messages.js'
import { _storeUpdatePhotosPublicity } from '../../../src/product/store.js'

export default function updatePhotosPublicity() {
  describe('updatePhotosPublicity', () => {
    describe('passed a non-existent product', () => {
      it('throws ResourceNotFound', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const fakeId = new ObjectId()

        const photos = [
          {
            productId: fakeId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: false,
            cover: false,
          },
          {
            productId: fakeId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: false,
            cover: false,
          },
          {
            productId: fakeId,
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: false,
            cover: false,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        try {
          await _storeUpdatePhotosPublicity(
            new ObjectId(),
            photosIds.map(photo => ({
              id: photo,
              public: true,
            })),
            { client, product, photo }
          )
        } catch (e) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          console.log('_storeUpdatePhotosPublicity threw, error:', e)
          return assert(ResourceNotFound.code === e.code)
        }

        await photo.deleteMany({})
        await product.deleteMany({})
        await client.close()

        assert.fail("didn't throw")
      })
    })

    describe("passed a photo that doesn't belong to the given product", () => {
      it('throws ResourceNotFound', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProduct = await product.insertOne({ expose: false })

        const photos = [
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: false,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: false,
            cover: false,
          },
          {
            productId: new ObjectId(),
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: false,
            cover: false,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        try {
          await _storeUpdatePhotosPublicity(
            resProduct.insertedId,
            photosIds.map(photo => ({
              id: photo,
              public: true,
            })),
            { client, product, photo }
          )
        } catch (e) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          console.log('_storeUpdatePhotosPublicity threw, error:', e)
          return assert(ResourceNotFound.code === e.code)
        }

        await photo.deleteMany({})
        await product.deleteMany({})
        await client.close()

        assert.fail()
      })

      it("doesn't change the other photos' publicity", async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProduct = await product.insertOne({ expose: false })

        const photos = [
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: false,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: false,
            cover: false,
          },
          {
            productId: new ObjectId(),
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: false,
            cover: false,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        try {
          await _storeUpdatePhotosPublicity(
            resProduct.insertedId,
            photosIds.map(photo => ({
              id: photo,
              public: true,
            })),
            { client, product, photo }
          )
        } catch (e) {
          // expected to throw
        }

        const photosDocs = await photo
          .find({
            _id: {
              $in: photosIds,
            },
          })
          .toArray()

        for (const _photo of photosDocs) {
          if (_photo.public) {
            await photo.deleteMany({})
            await product.deleteMany({})
            await client.close()

            return assert.fail('the public field of a photo changed')
          }
        }

        await photo.deleteMany({})
        await product.deleteMany({})
        await client.close()

        assert(true)
      })
    })

    describe("passed a public photo that's already public", () => {
      it("doesn't change the photo's order", async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProduct = await product.insertOne({ expose: false })

        const photos = [
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: true,
            order: 0,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: true,
            order: 1,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: true,
            order: 2,
            cover: false,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        const photosData = photosIds.map((photo, i) => {
          if (0 === i) {
            return {
              id: photo,
              public: true,
            }
          }

          return {
            id: photo,
            public: false,
          }
        })

        try {
          await _storeUpdatePhotosPublicity(resProduct.insertedId, photosData, {
            client,
            product,
            photo,
          })
        } catch (e) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          console.log('+storeUpdatePhotosPublicity threw, error:', e)
          return assert.fail('threw an error')
        }

        const photoDoc = await photo.findOne({
          _id: photosIds[0],
        })

        if (photoDoc.order !== 0) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          return assert.fail('the order of an already public photo changed')
        }

        assert(true)
      })
    })

    describe('passed photos with changed public field', () => {
      it('updates the public field correspondingly', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProduct = await product.insertOne({ expose: false })

        const photos = [
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: true,
            order: 0,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: false,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: true,
            order: 1,
            cover: false,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        const photosData = [
          {
            id: photosIds[0],
            public: false,
          },
          {
            id: photosIds[1],
            public: true,
          },
          {
            id: photosIds[2],
            public: false,
          },
        ]

        try {
          await _storeUpdatePhotosPublicity(resProduct.insertedId, photosData, {
            client,
            product,
            photo,
          })
        } catch (e) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          console.log('_storeUpdatePhotosPublicity threw, error:', e)
          return assert.fail('threw an error')
        }

        const photo0Doc = await photo.findOne({
          _id: photosIds[0],
        })

        const photo1Doc = await photo.findOne({
          _id: photosIds[1],
        })

        const photo2Doc = await photo.findOne({
          _id: photosIds[2],
        })

        if (photo0Doc.public !== false || photo1Doc.public !== true || photo2Doc.public !== false) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          return assert.fail("the public field of some or all photos hasn't been changed correctly")
        }

        assert(true)
      })
    })

    describe("passed a public photo that's currently not public", () => {
      it('set the order field to a number, greater than the greatest value among public photos', async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProduct = await product.insertOne({ expose: false })

        const photos = [
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: true,
            order: 0,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: true,
            order: 1,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: false,
            cover: false,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        const photosData = [
          {
            id: photosIds[2],
            public: true,
          },
        ]

        try {
          await _storeUpdatePhotosPublicity(resProduct.insertedId, photosData, {
            client,
            product,
            photo,
          })
        } catch (e) {
          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          console.log('_storeUpdatePhotosPublicity threw, error:', e)
          return assert.fail('threw an error')
        }

        const photoGreatestDoc = await photo.findOne({ _id: photosIds[1] })
        const photoUpdatedDoc = await photo.findOne({ _id: photosData[0].id })

        await photo.deleteMany({})
        await product.deleteMany({})
        await client.close()

        assert(photoUpdatedDoc.order > photoGreatestDoc.order)
      })
    })

    describe('sets all currently public photos of an exposed product to false', () => {
      it("throws a ValidationError and doesn't update the photos", async () => {
        const client = new MongoClient(
          `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
        )
        await client.connect()

        const photo = client.db(process.env.APP_DB_NAME).collection('photo')
        const product = client.db(process.env.APP_DB_NAME).collection('product')

        const resProduct = await product.insertOne({
          name: 'product',
          price: 10000,
          time: new Date(),
          is_in_stock: false,
          description: 'some description',
          expose: true,
        })

        const photos = [
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '0' },
            pathsLocal: { original: '0' },
            public: true,
            order: 0,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '1' },
            pathsLocal: { original: '1' },
            public: true,
            order: 1,
            cover: false,
          },
          {
            productId: resProduct.insertedId,
            pathsPublic: { original: '2' },
            pathsLocal: { original: '2' },
            public: true,
            order: 2,
            cover: true,
          },
        ]

        const resPhotos = await photo.insertMany(photos)

        const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
          ids[parseInt(index)] = resPhotos.insertedIds[index]
          return ids
        }, [])

        const photosData = [
          {
            id: photosIds[0],
            public: false,
          },
          {
            id: photosIds[1],
            public: false,
          },
          {
            id: photosIds[2],
            public: false,
          },
        ]

        try {
          await _storeUpdatePhotosPublicity(resProduct.insertedId, photosData, {
            client,
            product,
            photo,
          })
        } catch (e) {
          const photosDocs = await photo.find({ public: true }).toArray()

          await photo.deleteMany({})
          await product.deleteMany({})
          await client.close()

          return assert(e.code === ValidationError.code && photosDocs.length === photos.length)
        }

        await photo.deleteMany({})
        await product.deleteMany({})
        await client.close()

        assert.fail("didn't throw")
      })
    })
  })
}
