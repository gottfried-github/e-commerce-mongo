import {assert} from 'chai'
import * as m from '../../../fi-common/messages.js'

import {_create} from '../../src/product/controllers.js'
import {ValidationConflict} from '../../src/helpers.js'
import {ValidationError} from '../../src/helpers.js'

function testCreate() {
    describe("create throws a non-ValidationError error", () => {
        it("throws the error on AND doesn't call any other dependencies", async () => {
            const validateCalls = []
            const ERR_MSG = "an error message"

            try {
                await _create({}, {
                    create: async () => {throw new Error(ERR_MSG)},
                    validate: () => {validateCalls.push(null)},
                })
            } catch(e) {
                return assert(
                    // error is the one, thrown by update
                    ERR_MSG === e.message

                    // none of the other dependencies has been called
                    && [validateCalls.length].filter(l => 0 !== l).length === 0
                )
            }

            assert.fail("_create didn't throw")
        })
    })

    describe("create throws an ValidationError", () => {
        it("validate is called with the 'fields' argument", async () => {
            const fields = "fields"
            let isEqual = null

            // once getById is called, validate should be called and then _create should throw
            try {
                const res = await _create(fields, {
                    create: async () => {throw new ValidationError()},
                    validate: (_fields) => {
                        isEqual = fields === _fields
                    },
                })
            } catch(e) {
                return assert.strictEqual(isEqual, true)
            }

            assert.fail()
        })

        describe("validate returns falsy", () => {
            it("throws ValidationConflict", async () => {
                try {
                    await _create({}, {
                        create: async () => {throw new ValidationError()},
                        validate: () => {
                            return false
                        },
                    })
                } catch(e) {
                    return assert.instanceOf(e, ValidationConflict)
                }

                assert.fail()
            })
        })

        describe("validate returns truthy", () => {
            it("throws the returned value, wrapped in ValidationError", async () => {
                const errors = "errors"

                try {
                    await _create({}, {
                        create: async () => {throw new ValidationError()},
                        validate: () => {
                            return errors
                        },
                    })
                } catch(e) {
                    return assert.strictEqual(e.tree, errors)
                }

                assert.fail()
            })
        })
    })

    describe("create returns a value", () => {
        it("returns the returned value AND doesn't call the other dependencies", async () => {
            const validateCalls = []
            const id = "an id"

            const res = await _create({}, {
                create: async () => {return id},
                validate: () => {validateCalls.push(null)},
            })

            return assert(
                id === res

                // none of the other dependencies has been called
                && [validateCalls.length].filter(l => 0 !== l).length === 0
            )
        })
    })
}

export {testCreate}
