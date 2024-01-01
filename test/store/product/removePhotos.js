import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeRemovePhotos} from '../../../src/product/store.js'

export default function removePhotos() {
    describe("removePhotos", () => {
        describe("pass non-existent product", () => {
            it("throws ResourceNotFound", () => {

            })
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

                    assert(ResourceNotFound.code === e.code)
                }
            })
        })
    })
}