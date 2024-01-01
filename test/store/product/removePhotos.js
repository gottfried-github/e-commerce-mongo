import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeRemovePhotos} from '../../../src/product/store.js'

export default function removePhotos() {
    describe("removePhotos", () => {
        describe("pass non-existent product", () => {
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
                        cover: false,
                    },
                ]

                const resPhotos = await photo.insertMany(photos)

                const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
                    ids[parseInt(index)] = resPhotos.insertedIds[index]
                    return ids
                }, [])

                try {
                    await _storeRemovePhotos(fakeId, photosIds, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    assert(ResourceNotFound.code === e.code)
                }
            })

            // it("doesn't remove the given photos", async () => {})
        })

        describe("pass photos that don't reference the given product", () => {
            it("throws ResourceNotFound", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({expose: false})

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
                        cover: false,
                    },
                ]

                const resPhotos = await photo.insertMany(photos)

                const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
                    ids[parseInt(index)] = resPhotos.insertedIds[index]
                    return ids
                }, [])

                try {
                    await _storeRemovePhotos(resProduct.insertedId, photosIds, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    return assert(ResourceNotFound.code === e.code)
                }
            })
        })

        describe("pass existing photos referencing the given product", () => {
            it("deletes the photos", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const resProduct = await product.insertOne({
                    expose: false
                })

                const photos = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        cover: false,
                        public: true,
                        order: 0,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        cover: false,
                        public: true,
                        order: 1,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '2',
                        pathLocal: '2',
                        cover: false,
                        public: true,
                        order: 2,
                    },
                ]

                const resPhotos = await photo.insertMany(photos)

                const photosIds = Object.keys(resPhotos.insertedIds).reduce((ids, index) => {
                    ids[parseInt(index)] = resPhotos.insertedIds[index]
                    return ids
                }, [])

                let resRemovePhotos = null

                try {
                    resRemovePhotos = await _storeRemovePhotos(resProduct.insertedId, photosIds, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    return assert.fail("_storeRemovePhotos threw")
                }

                const photosDocs = await photo.find({
                    _id: {
                        $in: photosIds
                    }
                }).toArray()

                assert(photosDocs.length === 0)
            })
        })

        describe("delete all public photos of an exposed product", () => {
            it("sets product's expose to false", async () => {
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

                const photosPublic = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '0',
                        pathLocal: '0',
                        cover: false,
                        public: true,
                        order: 0,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '1',
                        pathLocal: '1',
                        cover: false,
                        public: true,
                        order: 1,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '2',
                        pathLocal: '2',
                        cover: false,
                        public: true,
                        order: 2,
                    },
                ]

                const photosPrivate = [
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '3',
                        pathLocal: '3',
                        cover: true,
                        public: false,
                    },
                    {
                        productId: resProduct.insertedId,
                        pathPublic: '3',
                        pathLocal: '3',
                        cover: false,
                        public: false,
                    },
                ]

                const resPhotosPublic = await photo.insertMany(photosPublic)
                const resPhotosPrivate = await photo.insertMany(photosPrivate)

                const photosPublicIds = Object.keys(resPhotosPublic.insertedIds).reduce((ids, index) => {
                    ids[parseInt(index)] = resPhotosPublic.insertedIds[index]
                    return ids
                }, [])

                let resRemovePhotos = null

                try {
                    resRemovePhotos = await _storeRemovePhotos(resProduct.insertedId, photosPublicIds, {client, product, photo})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    return assert.fail("_storeRemovePhotos threw")
                }

                const productDoc = await product.findOne({_id: resProduct.insertedId})

                assert(!productDoc.expose)
            })
        })

        describe("public photos are left but no cover photo left on an exposed product", () => {
            it("sets product's expose to false", () => {

            })
        })
    })
}