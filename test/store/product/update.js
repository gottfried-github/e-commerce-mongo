import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {ValidationError} from '../../../src/helpers.js'
import {_storeUpdate} from '../../../src/product/store.js'

export default function update() {
    describe("update", () => {
        describe("passed non-existent product id", () => {
            it("throws ResourceNotFound", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                let res = null

                try {
                    res = await _storeUpdate(new ObjectId(), {write: {expose: true}}, {photo, product})
                } catch (e) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    return assert(ResourceNotFound.code === e.code)
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                assert.fail("didn't throw")
            })
        })

        describe("passed expose true", () => {
            describe("no public photos, cover photo", () => {
                it("throws ValidationError", async () => {
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
                            public: false,
                            cover: true
                        },
                        {
                            productId: resProduct.insertedId,
                            pathPublic: '1',
                            pathLocal: '1',
                            public: false,
                            cover: false
                        },
                        {
                            productId: resProduct.insertedId,
                            pathPublic: '2',
                            pathLocal: '2',
                            public: false,
                            cover: false
                        },
                    ]

                    const resPhotos = await photo.insertMany(photos)

                    let resUpdate = null

                    try {
                        resUpdate = await _storeUpdate(resProduct.insertedId, {
                            write: {
                                expose: true
                            }
                        }, {product, photo})
                    } catch (e) {
                        await photo.deleteMany({})
                        await product.deleteMany({})
                        await client.close()

                        return assert.instanceOf(e, ValidationError)
                    }

                    assert.fail("didn't throw")
                })
            })

            describe("public photos present, no cover photo", () => {
                it("throws ValidationError", () => {
                    
                })
            })
        })
    })
}