import {assert} from 'chai'
import * as m from '../../../fi-common/messages.js'

import {ValidationError} from '../../src/helpers.js'
import {_update} from '../../src/product/controllers.js'
import {ValidationConflict} from '../../src/helpers.js'

function testUpdate() {
    describe("is passed an id", () => {
        it("passes the 'id' argument to validateObjectId", async () => {
            const id = "an id"
            let isEqual = null
            await _update(id, {write: {}, remove: []}, {update: async () => {return true}, getById: async () => {}, validate: () => {},
                validateObjectId: (_id) => {isEqual = id === _id}, containsId: () => {}
            })

            assert.strictEqual(isEqual, true)
        })
    })

    describe("validateObjectId returns truthy", () => {
        it("throws InvalidCriterion with the returned value as data AND doesn't call any other dependencies", async () => {
            // see '`_product`, testing `_update`: the order of `validateObjectId` and `containsId` doesn't matter' for why I don't check whether containsId has been called
            const updateCalls = [], getByIdCalls = [], validateCalls = []
            const idE = "a error with id"
            try {
                await _update("", {write: {}, remove: []}, {
                    update: async () => {updateCalls.push(null)},
                    getById: async () => {getByIdCalls.push(null)},
                    validate: () => {validateCalls.push(null)},
                    validateObjectId: () => {return idE},
                    containsId: () => {return false}
                })
            } catch(e) {
                return assert(
                    // error is an InvalidCriterion
                    m.InvalidCriterion.code === e.code

                    && idE === e.data

                    // none of the other dependencies has been called
                    && [updateCalls.length, getByIdCalls.length, validateCalls.length].filter(l => 0 !== l).length === 0
                )
            }

            assert.fail("_update didn't throw")
        })
    })

    describe("containsId returns truthy", () => {
        it("throws an ajv-errors-to-data-tree tree with _id set to FieldUnknown with the returned value as data AND doesn't call any other dependencies", async () => {
            const updateCalls = [], getByIdCalls = [], validateCalls = []
            const idFieldName = "_id"
            try {
                await _update("", {write: {}, remove: []}, {
                    update: async () => {updateCalls.push(null)},
                    getById: async () => {getByIdCalls.push(null)},
                    validate: () => {validateCalls.push(null)},
                    validateObjectId: () => {return false},
                    containsId: () => {return idFieldName}
                })
            } catch(e) {
                return assert(
                    // there's only _id property in e.node and it has a single error
                    1 === Object.keys(e.node).length && 1 === e.node._id?.errors.length

                    // the error is FieldUnknown with data being the value returned by containsId
                    && m.FieldUnknown.code === e.node._id.errors[0].code
                    // && idFieldName === e.node._id.errors[0].data

                    // none of the other dependencies has been called
                    && [updateCalls.length, getByIdCalls.length, validateCalls.length].filter(l => 0 !== l).length === 0
                )
            }

            assert.fail("_update didn't throw")
        })
    })

    describe("validateObjectId and containsId return falsy", () => {
        it("update gets called AND the arguments are passed to it", async () => {
            const id = "an id", _write = "write", _remove = "remove"
            let isEqual = null

            await _update(id, {write: _write, remove: _remove}, {
                update: async (_id, {write, remove}) => {isEqual = id === _id && _write === write && _remove === remove; return true},
                getById: async () => {},
                validate: () => {},
                validateObjectId: () => {return false},
                containsId: (data) => {return false}
            })

            assert.strictEqual(isEqual, true)
        })
    })

    describe("update throws a non-ValidationError error", () => {
        it("throws the error on AND doesn't call any other dependencies", async () => {
            const ERR_MSG = "an error message"

            try {
                await _update("", {write: {}, remove: []}, {
                    update: async () => {throw new Error(ERR_MSG)},
                    getById: async () => {/*getByIdCalls.push(null)*/},
                    validate: () => {/*validateCalls.push(null)*/},
                    validateObjectId: () => {return false},
                    containsId: () => {return false}
                })
            } catch(e) {
                return assert(
                    // error is the one, thrown by update
                    ERR_MSG === e.message
                )
            }

            assert.fail("_update didn't throw")
        })
    })

    describe("update throws an ValidationError", () => {
        it("getById is called with the 'id' argument", async () => {
            const id = "an id"
            let isEqual = null

            // once getById is called, validate should be called and then _update should throw
            try {
                const res = await _update(id, {write: {}, remove: []}, {
                    update: async () => {throw new ValidationError()},
                    getById: async (_id) => {isEqual = id === _id},
                    validate: () => {return true},
                    validateObjectId: () => {return false},
                    containsId: () => {return false}
                })
            } catch(e) {
                return assert.strictEqual(isEqual, true)
            }

            assert.fail()
        })

        it("validate is called with the mix of 'write' and the doc, returned by 'getById'", async () => {
            const write = {a: 0, b: 1}, remove = [], doc = {b: 2}
            let _fieldsCorrect = null

            // once getById is called, validate should be called and then _update should throw
            try {
                const res = await _update("", {write, remove}, {
                    update: async () => {throw new ValidationError()},
                    getById: async () => {return doc},
                    validate: (_fields) => {
                        const keys = Object.keys(_fields)
                        _fieldsCorrect = 2 === keys.length && keys.includes('a') && keys.includes('b')
                        && write.a === _fields.a && doc.b === _fields.b
                    },
                    validateObjectId: () => {return false},
                    containsId: () => {return false}
                })
            } catch(e) {
                return assert.strictEqual(_fieldsCorrect, true)
            }

            assert.fail()
        })
        
        it("validate is called with the mix of 'write' and the doc, returned by 'getById' and modified by 'remove'", async () => {
            const write = {a: 0, b: 1}, remove = ['c'], doc = {b: 2, c: 3}
            
            let _fieldsCorrect = null

            // once getById is called, validate should be called and then _update should throw
            try {
                const res = await _update("", {write, remove}, {
                    update: async () => {throw new ValidationError()},
                    getById: async () => {return doc},
                    validate: (_fields) => {
                        const keys = Object.keys(_fields)
                        _fieldsCorrect = 2 === keys.length && keys.includes('a') && keys.includes('b') && !keys.includes('c')
                        && write.a === _fields.a && doc.b === _fields.b
                    },
                    validateObjectId: () => {return false},
                    containsId: () => {return false}
                })
            } catch(e) {
                return assert.strictEqual(_fieldsCorrect, true)
            }

            assert.fail()
        })

        describe("validate returns falsy", () => {
            it("throws ValidationConflict", async () => {
                try {
                    await _update("", {write: {}, remove: []}, {
                        update: async () => {throw new ValidationError()},
                        getById: async () => {return true},
                        validate: () => {
                            return false
                        },
                        validateObjectId: () => {return false},
                        containsId: () => {return false}
                    })
                } catch(e) {
                    return assert.instanceOf(e, ValidationConflict)
                }

                assert.fail()
            })
        })

        describe("validate returns truthy", () => {
            it("throws the returned value wrapped in ValidationError", async () => {
                const errors = "errors"

                try {
                    await _update("", {write: {}, remove: []}, {
                        update: async () => {throw new ValidationError()},
                        getById: async () => {return true},
                        validate: () => {
                            return errors
                        },
                        validateObjectId: () => {return false},
                        containsId: () => {return false}
                    })
                } catch(e) {
                    return assert.strictEqual(e.tree, errors)
                }

                assert.fail()
            })
        })
    })

    describe("update returns null", () => {
        it("throws InvalidCriterion AND doesn't call the other dependencies", async () => {
            const getByIdCalls = [], validateCalls = []

            try {
                await _update("", {write: {}, remove: []}, {
                    update: async () => {return null},
                    getById: async () => {getByIdCalls.push(null)},
                    validate: () => {validateCalls.push(null)},
                    validateObjectId: () => {return false},
                    containsId: () => {return false}
                })
            } catch(e) {
                return assert(
                    // the error is an InvalidCriterion
                    m.InvalidCriterion.code === e.code

                    // none of the other dependencies has been called
                    && [getByIdCalls.length, validateCalls.length].filter(l => 0 !== l).length === 0
                )
            }

            assert.fail("didn't throw")
        })
    })

    describe("update returns false", () => {
        it("returns true AND doesn't call the other dependencies", async () => {
            const getByIdCalls = [], validateCalls = []
            const res = await _update("", {write: {}, remove: []}, {
                update: async () => {return false},
                getById: async () => {getByIdCalls.push(null)},
                validate: () => {validateCalls.push(null)},
                validateObjectId: () => {return false},
                containsId: () => {return false}
            })

            return assert(
                true === res

                // none of the other dependencies has been called
                && [getByIdCalls.length, validateCalls.length].filter(l => 0 !== l).length === 0
            )
        })
    })

    describe("update returns true", () => {
        it("returns true AND doesn't call the other dependencies", async () => {
            const getByIdCalls = [], validateCalls = []
            const res = await _update("", {write: {}, remove: []}, {
                update: async () => {return true},
                getById: async () => {getByIdCalls.push(null)},
                validate: () => {validateCalls.push(null)},
                validateObjectId: () => {return false},
                containsId: () => {return false}
            })

            return assert(
                true === res

                // none of the other dependencies has been called
                && [getByIdCalls.length, validateCalls.length].filter(l => 0 !== l).length === 0
            )
        })
    })
}

export {testUpdate}
