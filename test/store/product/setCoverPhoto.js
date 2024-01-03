import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {_storeSetCoverPhoto} from '../../../src/product/store.js'

export default function setCoverPhoto() {
    describe("setCoverPhoto", () => {
        describe("given a non-existent product", () => {
            it("throws ResourceNotFound", () => {

            })
        })

        describe("given a photo that doesn't belong to the given product", () => {
            it("throws ResourceNotFound", () => {
                
            })
        })

        describe("given a previously non-cover photo with cover set to true", () => {
            it("sets previous cover photo to false", () => {

            })

            it("updates the given photo", () => {

            })
        })

        describe("given a photo of an exposed product with cover set to false", () => {
            it("updates the given photo", () => {

            })

            it("sets the product's expose field to false", () => {

            })
        })
    })
}