import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeUpdatePhotosPublicity} from '../../../src/product/store.js'

export default function updatePhotosPublicity() {
    describe("updatePhotosPublicity", () => {
        describe("passed a non-existent product", () => {
            it("throws ResourceNotFound", () => {
                
            })
        })

        describe("passed a photo that doesn't belong to the given product", () => {
            it("doesn't change the other photos' publicity", () => {

            })

            it("throws ResourceNotFound", () => {

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