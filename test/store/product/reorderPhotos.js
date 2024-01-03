import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {ValidationError} from '../../../src/helpers.js'
import {_storeReorderPhotos} from '../../../src/product/store.js'

export default function reorderPhotos() {
    describe("reorderPhotos", () => {
        describe("passed a non-existent product", () => {
            it("throws ResourceNotFound", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const fakeId = new ObjectId()

                const photos = [
                    {
                        productId: fakeId,
                        pathPublic: '0',
                        pathLocal: '0',
                        public: true,
                        order: 0,
                        cover: false,
                    },
                    {
                        productId: fakeId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: true,
                        order: 1,
                        cover: false,
                    },
                    {
                        productId: fakeId,
                        pathPublic: '2',
                        pathLocal: '2',
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

                const photosData = [
                    {
                        id: photosIds[0],
                        order: 2
                    },
                    {
                        id: photosIds[1],
                        order: 1
                    },
                    {
                        id: photosIds[0],
                        order: 0
                    },
                ]

                try {
                    await _storeReorderPhotos(new ObjectId(), photosData, {client, product, photoC: photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeUpdatePhotosPublicity threw, error:", e)
                    return assert(ResourceNotFound.code === e.code)
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert.fail("didn't throw")
            })
        })

        describe("passed a photo that doesn't belong to the given product", () => {
            it("throws ResourceNotFound", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({expose: false})

                const fakeId = new ObjectId()

                const photos = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        public: true,
                        order: 0,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: true,
                        order: 1,
                        cover: false,
                    },
                    {
                        productId: fakeId,
                        pathPublic: '2',
                        pathLocal: '2',
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
                        order: 2,
                    },
                    {
                        id: photosIds[2],
                        order: 0,
                    },
                ]

                try {
                    await _storeReorderPhotos(resProduct.insertedId, photosData, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeUpdatePhotosPublicity threw, error:", e)
                    return assert(ResourceNotFound.code === e.code)
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert.fail("didn't throw")
            })

            it("doesn't modify any of the photos", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({expose: false})

                const fakeId = new ObjectId()

                const photos = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        public: true,
                        order: 0,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: true,
                        order: 1,
                        cover: false,
                    },
                    {
                        productId: fakeId,
                        pathPublic: '2',
                        pathLocal: '2',
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
                        order: 2,
                    },
                    {
                        id: photosIds[2],
                        order: 0,
                    },
                ]

                try {
                    await _storeReorderPhotos(resProduct.insertedId, photosData, {client, product, photo})
                } catch (e) {
                    // expected to throw
                }

                const photoDoc = await photo.findOne({
                    _id: new ObjectId(photosData[0].id)
                })

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert(photoDoc.order === 0)
            })
        })

        describe("passed a photo that is not public in the database", () => {
            it("throws ResourceNotFound", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({expose: false})

                const photos = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        public: true,
                        order: 0,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: true,
                        order: 1,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '2',
                        pathLocal: '2',
                        public: false,
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
                        order: 2,
                    },
                    {
                        id: photosIds[2],
                        order: 0,
                    },
                ]

                try {
                    await _storeReorderPhotos(resProduct.insertedId, photosData, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeUpdatePhotosPublicity threw, error:", e)
                    return assert(ResourceNotFound.code === e.code)
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert.fail("didn't throw")
            })
        })

        describe("length of passed photos is not the same as the number of existing photos", () => {
            it("throws ValidationError", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({expose: false})

                const photos = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        public: true,
                        order: 0,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: true,
                        order: 1,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '2',
                        pathLocal: '2',
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
                        order: 1,
                    },
                    {
                        id: photosIds[1],
                        order: 0,
                    },
                ]

                try {
                    await _storeReorderPhotos(resProduct.insertedId, photosData, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeReorderPhotos threw, error:", e)
                    return assert.instanceOf(e, ValidationError)
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert.fail("didn't throw")
            })
        })

        describe("passed updated order of all existing photos", () => {
            it("updates the photos", () => {

            })
        })
    })
}