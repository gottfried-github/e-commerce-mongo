import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeAddPhotos} from '../../../src/product/store.js'

export default function addPhotos(client) {
    describe('addPhotos', () => {
        describe('passed non-existing product id', () => {
            it("throws and doesn't write photos", async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                let res = null
    
                const photos = [
                    {
                        pathPublic: '3',
                        pathLocal: '3'
                    },
                    {
                        pathPublic: '4',
                        pathLocal: '4'
                    },
                    {
                        pathPublic: '5',
                        pathLocal: '5'
                    },
                ]

                try {
                    res = await _storeAddPhotos(new ObjectId(), photos, {product, photo})
                } catch (e) {
                    console.log('_storeAddPhotos threw - e:', e)
                    if (ResourceNotFound.code !== e.code) {
                        await photo.deleteMany({})
                        await product.deleteMany({})
                        await client.close()

                        assert.fail(e, true, 'expected to throw ResourceNotFound, instead, threw a different error')
                    }

                    const photosWritten = await photo.find({pathPublic: {
                        $in: ['3', '4', '5']
                    }}).toArray()
    
                    console.log('photosWritten:', photosWritten)

                    if (photosWritten.length) {
                        await photo.deleteMany({})
                        await product.deleteMany({})
                        await client.close()

                        assert.fail("should not have written photos to the 'photo' collection, but the photos are written")
                    }

                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    assert(true)
                }
            })
        })

        describe('passed existing product id', () => {
            it('writes photos to photo, adds them to product.photos_all and returns true', async () => {
                const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
                await client.connect()

                const photo = client.db(process.env.APP_DB_NAME).collection('photo')
                const product = client.db(process.env.APP_DB_NAME).collection('product')

                const photosInitialRes = await photo.insertMany([
                    {path: '0'},
                    {path: '1'},
                    {path: '2'},
                ])
    
                const productRes = await product.insertOne({
                    expose: false,
                    photos_all: Object.keys(photosInitialRes.insertedIds).map(k => photosInitialRes.insertedIds[k])
                })
    
                console.log('productRes:', productRes)

                let res = null
    
                const photos = [
                    {path: '3'},
                    {path: '4'},
                    {path: '5'},
                ]

                try {
                    res = await _storeAddPhotos(productRes.insertedId, photos, {client, product, photo})
                } catch (e) {
                    console.log('_storeAddPhotos threw - e:', e)
                    assert.fail(e, true, 'expected to return "true", instead, threw the error')
                }
    
                const photosWritten = await photo.find({path: {
                    $in: ['3', '4', '5']
                }}).toArray()

                console.log('photosWritten:', photosWritten)

                if (photosWritten.length !== 3) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    assert.fail('photos were not written to the photo collection properly')
                }

                const productWithPhotos = await product.findOne({photos_all: {
                    $all: photosWritten.map(photo => photo._id)
                }})

                console.log('productWithPhotos:', productWithPhotos)

                if (!productWithPhotos) {
                    await photo.deleteMany({})
                    await product.deleteMany({})
                    await client.close()

                    assert.fail('photos were not written to product.photos_all')
                }

                await photo.deleteMany({})
                await product.deleteMany({})
                await client.close()

                console.log('res:', res)
                assert(true === res)
            })
        })
    })
}