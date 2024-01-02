import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeUpdatePhotosPublicity} from '../../../src/product/store.js'

export default function updatePhotosPublicity() {
    describe("updatePhotosPublicity", () => {
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
                    await _storeUpdatePhotosPublicity(new ObjectId(), photosIds.map(photo => ({
                        id: photo,
                        public: true
                    })), {client, product, photo})
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
                        productId: new ObjectId(),
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
                    await _storeUpdatePhotosPublicity(resProduct.insertedId, photosIds.map(photo => ({
                        id: photo,
                        public: true
                    })), {client, product, photo})
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

                assert.fail()
            })

            it("doesn't change the other photos' publicity", async () => {
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
                        productId: new ObjectId(),
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
                    await _storeUpdatePhotosPublicity(resProduct.insertedId, photosIds.map(photo => ({
                        id: photo,
                        public: true
                    })), {client, product, photo})
                } catch (e) {
                    // expected to throw
                }

                const photosDocs = await photo.find({
                    _id: {
                        $in: photosIds
                    }
                }).toArray()

                for (const _photo of photosDocs) {
                    if (_photo.public) {
                        await photo.deleteMany({})
                        await product.deleteMany({})
                        await client.close()

                        return assert.fail("the public field of a photo changed")
                    }
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert(true)
            })
        })

        describe("passed a public photo that's already public", () => {
            it("doesn't change the photo's order", () => {

            })
        })

        describe("passed a public photo that's currently not public", () => {
            it("set the order field to a number, greater than the greatest value among public photos", () => {

            })
        })

        describe("sets all currently public photos of an exposed product to false", () => {
            it("sets the expose field on the product to false", () => {

            })
        })
    })
}