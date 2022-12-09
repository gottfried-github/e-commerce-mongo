import {assert} from 'chai'
import * as m from '../../../fi-common/messages.js'

import {_updatePhotos} from '../../src/product/controllers.js'

function testUpdatePhotos() {
    describe("passed an id", () => {
        it("calls validateObjectId", async () => {
            let isCalled = null

            await _updatePhotos('an id', ['an id'], {
                updatePhotos: () => true, 
                validate: () => null, 
                validateObjectId: () => {
                    isCalled = true
                    
                    return null
                }
            })

            assert.strictEqual(isCalled, true)
        })

        it("calls validateObjectId with the passed id", async () => {
            const id = 'an id'
            let idPassed = null

            await _updatePhotos(id, ['an id'], {
                updatePhotos: () => true, 
                validate: () => null, 
                validateObjectId: (_id) => {
                    idPassed = _id
                    
                    return null
                }
            })

            assert.strictEqual(idPassed, id)
        })
    })

    describe("validateObjectId returns truthy", async () => {
        it("throws", async () => {
            try {
                await _updatePhotos('an id', ['an id'], {
                    updatePhotos: () => true,
                    validate: () => null,
                    validateObjectId: () => true
                })
            } catch(e) {
                return assert(true)
            }

            assert.fail("doesn't throw")
        })

        it("throws InvalidCriterion", async () => {
            const err = 'an error'

            try {
                await _updatePhotos('an id', ['an id'], {
                    updatePhotos: () => true,
                    validate: () => null,
                    validateObjectId: () => err
                })
            } catch(e) {
                return assert.strictEqual(e.code, m.InvalidCriterion.code)
            }

            assert.fail("doesn't throw")
        })
    })
}

export {testUpdatePhotos}