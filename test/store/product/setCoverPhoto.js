import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeSetCoverPhoto} from '../../../src/product/store.js'

export default function setCoverPhoto() {
    describe("setCoverPhoto", () => {
        describe("given a non-existent product", () => {
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
                        public: false,
                        cover: false,
                    },
                    {
                        productId: fakeId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: false,
                        cover: false,
                    },
                    {
                        productId: fakeId,
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

                try {
                    await _storeSetCoverPhoto(new ObjectId(), {
                        id: photosIds[2],
                        cover: false
                    }, {client, product, photoC: photo})
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

        describe("given a photo that doesn't belong to the given product", () => {
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
                        public: false,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: false,
                        cover: false,
                    },
                    {
                        productId: fakeId,
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

                try {
                    await _storeSetCoverPhoto(resProduct.insertedId, {
                        id: photosIds[2],
                        cover: false
                    }, {client, product, photoC: photo})
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

        describe("given a previously non-cover photo with cover set to true", () => {
            it("sets previous cover photo to false", async () => {
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
                        public: false,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: false,
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

                try {
                    await _storeSetCoverPhoto(resProduct.insertedId, {
                        id: photosIds[1],
                        cover: true
                    }, {client, product, photoC: photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeSetCoverPhoto threw, error:", e)
                    return assert.fail("threw an error")
                }

                const photoDoc = await photo.findOne({_id: photosIds[2]})

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert(!photoDoc.cover)
            })

            it("updates the given photo", async () => {
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
                        public: false,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: false,
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

                try {
                    await _storeSetCoverPhoto(resProduct.insertedId, {
                        id: photosIds[1],
                        cover: true
                    }, {client, product, photoC: photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeSetCoverPhoto threw, error:", e)
                    return assert.fail("threw an error")
                }

                const photoDoc = await photo.findOne({_id: photosIds[1]})

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert(photoDoc.cover)
            })
        })

        describe("given a photo of an exposed product with cover set to false", () => {
            it("updates the given photo", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({
                    name: 'product',
                    price: 10000,
                    time: new Date(),
                    is_in_stock: false,
                    description: 'some description',
                    expose: true
                })

                const photos = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        public: false,
                        cover: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        public: false,
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

                try {
                    await _storeSetCoverPhoto(resProduct.insertedId, {
                        id: photosIds[2],
                        cover: false
                    }, {client, product, photoC: photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeSetCoverPhoto threw, error:", e)
                    return assert.fail("threw an error")
                }

                const photoDoc = await photo.findOne({_id: photosIds[2]})

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert(!photoDoc.cover)
            })

            it("sets the product's expose field to false", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({
                    name: 'product',
                    price: 10000,
                    time: new Date(),
                    is_in_stock: false,
                    description: 'some description',
                    expose: true
                })

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

                try {
                    await _storeSetCoverPhoto(resProduct.insertedId, {
                        id: photosIds[2],
                        cover: false
                    }, {client, product, photoC: photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    console.log("_storeSetCoverPhoto threw, error:", e)
                    return assert.fail("threw an error")
                }

                const productDoc = await product.findOne({_id: resProduct.insertedId})

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert(!productDoc.expose)
            })
        })
    })
}