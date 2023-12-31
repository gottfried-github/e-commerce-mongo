import {MongoClient, ObjectId} from 'mongodb'
import {assert} from 'chai'

import {ResourceNotFound} from '../../../../e-commerce-common/messages.js'
import {ValidationError} from '../../../src/helpers.js'
import {_storeUpdate} from '../../../src/product/store.js'

export default function update() {
    describe("update", () => {
        describe("passed non-existent product id", () => {
            it("throws ResourceNotFound", () => {
                
            })
        })

        describe("passed expose true", () => {
            describe("no public photos, cover photo", () => {
                it("throws ValidationError", () => {

                })
            })

            describe("public photos present, no cover photo", () => {
                it("throws ValidationError", () => {
                    
                })
            })
        })
    })
}