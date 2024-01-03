import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {ValidationError} from '../../../src/helpers.js'
import {_storeSetCoverPhoto} from '../../../src/product/store.js'

export default function reorderPhotos() {
    describe("reorderPhotos", () => {
        describe("passed a non-existent product", () => {
            it("throws ResourceNotFound", () => {

            })
        })

        desribe("passed a photo that doesn't belong to the given product", () => {
            it("throws ResourceNotFound", () => {

            })

            it("doesn't modify any of the photos", () => {

            })
        })

        describe("length of passed photos is not the same as the number of existing photos", () => {
            it("throws ValidationError", () => {

            })
        })

        describe("passed updated order of all existing photos", () => {
            it("updates the photos", () => {

            })
        })
    })
}