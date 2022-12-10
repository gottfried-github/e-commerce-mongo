import {assert} from 'chai'
import * as m from '../../../fi-common/messages.js'
import {ValidationError, ValidationConflict} from '../../src/helpers.js'

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
    })

    describe("updatePhotos throws", () => {
        it("throws the thrown value", async () => {
            const err = 'an error'

            try {
                await _updatePhotos('an id', ['an id'], {
                    updatePhotos: () => {throw err},
                    validate: () => null,
                    validateObjectId: () => null
                })
            } catch(e) {
                return assert.strictEqual(e, err)
            }

            assert.fail("doesn't throw")
        })
    })

    describe("updatePhotos throws ValidationError", () => {
        it("calls validate", async () => {
            let isCalled = null

            _updatePhotos('an id', ['an id'], {
                updatePhotos: () => {throw new ValidationError()},
                validate: () => {isCalled = true; return true},
                validateObjectId: () => null
            })

            assert.isTrue(isCalled)
        })
        
        it("calls validate with passed 'photos'", async () => {
            const photos = ['an id']
            let _photos = null

            try {
                await _updatePhotos('an id', photos, {
                    updatePhotos: async () => {throw new ValidationError()},
                    validate: (v) => {_photos = v; return true},
                    validateObjectId: () => null
                })
            } catch(e) {}

            assert.deepEqual(_photos.photos_all, photos)
        })

        describe("validate returns truthy", () => {
            it("throws ValidationError message", async () => {
                try {
                    await _updatePhotos('an id', ['an id'], {
                        updatePhotos: async () => {throw new ValidationError()},
                        validate: () => true,
                        validateObjectId: () => null
                    })
                } catch(e) {
                    return assert.strictEqual(e.code, m.ValidationError.code)
                }
    
                assert.fail("doesn't throw")
            })  
        })

        describe("validate returns falsy", () => {
            it("throws ValidationConflict", async () => {
                try {
                    await _updatePhotos('an id', ['an id'], {
                        updatePhotos: async () => {throw new ValidationError()},
                        validate: () => null,
                        validateObjectId: () => null
                    })
                } catch(e) {
                    return assert.instanceOf(e, ValidationConflict)
                }
    
                assert.fail("doesn't throw")
            })
        })
    })

    describe("updatePhotos returns", () => {
        it("returns the returned value", async () => {
            const res = await _updatePhotos('an id', ['an id'], {
                updatePhotos: () => true,
                validate: () => null,
                validateObjectId: () => null
            })

            assert.isTrue(res)
        })
    })
}

export {testUpdatePhotos}