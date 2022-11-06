import {assert} from 'chai'
import * as m from '../../../bazar-common/messages.js'
import {ValidationError, ValueNotUnique, ValidationConflict} from '../../src/helpers.js'

import {_create} from '../../src/auth/controllers.js'

function testCreate() {
    describe('called', () => {
        it('create cb is called with data returned by generateHash', async () => {
            const data = 'some data'
            let isEqual = false

            await _create({password: 'some pswd'}, {
                generateHash: () => {
                    return {someProp: data}
                },
                create: async (_data) => {
                    isEqual = data === _data.someProp
                }
            })

            assert.strictEqual(isEqual, true)
        })
    })
    
    describe("'create' cb returns", () => {
        it("returns the value, returned by 'create' cb", async () => {
            const data = "some data"
            const res = await _create({}, {
                generateHash: () => {},
                create: async () => {
                    return data
                }
            })

            assert.strictEqual(res, data)
        })
    })

    describe("'create' cb throws ValidationError", () => {
        it('calls validate', async () => {
            let isCalled = false
            
            try {
                await _create({}, {
                    create: async () => {throw new ValidationError("some message")},
                    validate: () => {isCalled = true; return "some errors"},
                    generateHash: () => {}
                })
            } catch (e) {}

            assert.strictEqual(isCalled, true)
        })

        describe('validate returns null', () => {
            it('throws ValidationConflict', async () => {
                let properErr = false

                try {
                    await _create({}, {
                        create: async () => {throw new ValidationError("some message")},
                        validate: () => {return null},
                        generateHash: () => {}
                    })
                } catch (e) {
                    properErr = e instanceof ValidationConflict
                }

                assert.strictEqual(properErr, true)
            })
        })

        describe('validate returns data', () => {
            it('throws the data', async () => {
                let data = "some errors",
                isEqual = false
            
                try {
                    await _create({}, {
                        create: async () => {throw new ValidationError("some message")},
                        validate: () => {return data},
                        generateHash: () => {}
                    })
                } catch (e) {
                    isEqual = e === data
                }

                assert.strictEqual(isEqual, true)
            })
        })
    })

    describe("'create' cb throws ValueNotUnique", async () => {
        const fieldName = 'name'
        let e = null

        try {
            await _create({}, {
                create: async () => {throw new ValueNotUnique("some message", {field: fieldName})},
                validate: () => {},
                generateHash: () => {}
            })
        } catch (_e) {
            e = _e
        }

        assert(
            fieldName in e.node &&
            e.node[fieldName].errors.length === 1 &&
            e.node.errors[0].code === m.ValidationError.code
        )
    })
}

export {testCreate}