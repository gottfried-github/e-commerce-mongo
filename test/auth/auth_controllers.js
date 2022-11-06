import {assert} from 'chai'
import {ObjectId} from 'bson'

import * as m from '../../../bazar-common/messages.js'
import {ValidationError, ValueNotUnique, ValidationConflict} from '../../src/helpers.js'

import {_create, _getById} from '../../src/auth/controllers.js'

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
                try {
                    await _create({}, {
                        create: async () => {throw new ValidationError("some message")},
                        validate: () => {return null},
                        generateHash: () => {}
                    })
                } catch (e) {
                    return assert(e instanceof ValidationConflict)
                }

                assert.fail("didn't throw")
            })
        })

        describe('validate returns data', () => {
            it('throws the data', async () => {
                let data = "some errors"
            
                try {
                    await _create({}, {
                        create: async () => {throw new ValidationError("some message")},
                        validate: () => {return data},
                        generateHash: () => {}
                    })
                } catch (e) {
                    return assert.strictEqual(e, data)
                }

                assert.fail("didn't throw")
            })
        })
    })

    describe("'create' cb throws ValueNotUnique", async () => {
        it('throws ValidationError', async () => {
            const fieldName = 'name'

            try {
                await _create({}, {
                    create: async () => {throw new ValueNotUnique("some message", {field: fieldName})},
                    validate: () => {},
                    generateHash: () => {}
                })
            } catch (e) {
                return assert(
                    fieldName in e.node &&
                    e.node[fieldName].errors.length === 1 &&
                    e.node[fieldName].errors[0].code === m.ValidationError.code
                )
            }

            assert.fail("didn't throw")
        })
    })
}

function testGetById() {
    describe("is passed an id", () => {
        it("passes the id to validateObjectId", async () => {
            const id = new ObjectId()
            let isEqual = null

            await _getById(id, {
                validateObjectId: (_id) => {isEqual = id === _id},
                getById: async () => {return {name: 'name', _id: 'id'}},
            })

            assert.strictEqual(isEqual, true)
        })
    })

    describe('validateObjectId returns truthy', () => {
        it("throws InvalidCriterion with the returned value as data", async () => {
            const idE = "an error with id"
            
            try {
                await _getById("", {
                    validateObjectId: () => {return idE},
                    getById: async () => {},
                })
            } catch(e) {
                return assert(
                    // error is an InvalidCriterion
                    m.InvalidCriterion.code === e.code && 
                    idE === e.data
                )
            }

            assert.fail("_getById didn't throw")
        })

        it("doesn't call any other dependencies", async () => {
            const getByIdCalls = []

            try {
                await _getById("", {
                    validateObjectId: () => {return idE},
                    getById: async () => {getByIdCalls.push(null)},
                })
            } catch(e) {
                return assert.strictEqual(getByIdCalls.length, 0)
            }

            assert.fail("_getById didn't throw")
        })
    })
}

export {testCreate, testGetById}