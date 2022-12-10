import {assert} from 'chai'

import * as m from '../../../fi-common/messages.js'
import {ValidationError, ValidationConflict} from '../../src/helpers.js'

import {_createMany} from '../../src/photo/controllers.js'

function testCreateMany() {
    describe("passed data", () => {
        it("calls createMany with the data", async () => {
            const data = [{path: 'some/path'}]
            let _data = null

            await _createMany(data, {createMany: async (v) => {
                _data = v
            }, validate: () => null})

            assert.deepEqual(data, _data)
        })
    })

    describe("createMany throws", () => {
        it("throws the thrown error", async () => {
            const e = new Error('some message')
            
            try {
                await _createMany([{path: 'some/path'}], {createMany: async () => {
                    throw e
                }, validate: () => null})
            } catch(_e) {
                return assert.strictEqual(_e.message, e.message)
            }

            assert.fail("didn't throw")
        })
    })
    
    describe("createMany throws ValidationError", () => {
        it("calls validate with specified data", async () => {
            const data = [{path: 'some/path'}]
            let _data = null

            try {
                await _createMany(data, {createMany: async () => {
                    throw new ValidationError('validation error', {index: 0})
                }, validate: (v) => {
                    _data = v

                    return true
                }})
            } catch(e) {}

            assert.deepEqual(_data, data[0])
        })

        describe("validate returns truthy", () => {
            it("throws ValidationError message", async () => {
                try {
                    await _createMany([{path: 'some/path'}], {createMany: async () => {
                        throw new ValidationError('validation error', {index: 0})
                    }, validate: (v) => true})
                } catch(e) {
                    return assert.strictEqual(e.code, m.ValidationError.code)
                }

                assert.fail("didn't throw")
            })
        })
        
        describe("validate returns falsy", () => {
            it("throws ValidationConflict", async () => {
                try {
                    await _createMany([{path: 'some/path'}], {createMany: async () => {
                        throw new ValidationError('validation error', {index: 0})
                    }, validate: (v) => null})
                } catch(e) {
                    return assert.instanceOf(e, ValidationConflict)
                }

                assert.fail("didn't throw")
            })
        })
    })

    describe("createMany returns", () => {
        it("returns the returned value", async () => {
            const res = await _createMany([{path: 'some/path'}], {createMany: () => true, validate: () => null})

            assert.isTrue(res)
        })
    })
}

export {testCreateMany}