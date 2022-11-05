import {Binary, BSONTypeError} from 'bson'
import {assert} from 'chai'

import {toTree} from 'ajv-errors-to-data-tree'
import * as m from '../../../bazar-common/messages.js'

import {validate, _validate, _validateBSON} from '../../src/auth/validate.js'

// class StubError extends Error {constructor(...args) {super(...args)}}

function testValidate() {
    describe("validate returns no errors", () => {
        it("calls validateBSON with passed data", () => {
            const data = "some data"
            let isEqual = false

            validate(data, {
                validate: () => true, 
                validateBSON: (_data) => {
                    isEqual = data === _data
                }
            })

            assert.strictEqual(isEqual, true)
        })

        it("returns value, returned by validateBSON", () => {
            const data = "some data"
            let isEqual = false

            const res = validate(data, {
                validate: () => true, 
                validateBSON: (_data) => {return _data}
            })

            assert.strictEqual(res, data)
        })
    })

    describe("both hash and salt json-invalid", () => {
        it("returns ajv-generated errors", () => {
            // const err = "some err" 

            const res = validate({name: "abcdefghi"}, {
                validate: _validate, 
                validateBSON: () => {}, 
                toTree
            })

            const keys = Object.keys(res.node)

            assert(
                keys.length === 2 &&
                keys.includes('hash') && keys.includes('salt') &&

                res.node.hash.errors.length === 1 &&
                res.node.hash.errors[0].data.keyword === 'required' &&

                res.node.salt.errors.length === 1 &&
                res.node.salt.errors[0].data.keyword === 'required'
            )
        })

        it("doesn't call validateBSON", () => {
            let validateBSONCalled = false

            validate({name: "abcdefghi"}, {
                validate: _validate, 
                validateBSON: () => {validateBSONCalled = true}, 
                toTree
            })

            assert.strictEqual(validateBSONCalled, false)
        })
    })

    describe('one of hash and salt is json-invalid', () => {
        it('calls validateBSON with passed fields', () => {
            let validateBSONCalled = false

            validate({name: "abcdefghi", salt: new Binary('abcdefg')}, {
                validate: _validate,
                validateBSON: () => {validateBSONCalled = true; return {node: {}}},
                toTree
            })

            assert.strictEqual(validateBSONCalled, true)
        })

        it('has validateBSON-generated errors in returned errors', () => {
            const err = "some error"

            const res = validate({name: "abcdefghi", salt: 5}, {
                validate: _validate,
                validateBSON: () => {return {node: {salt: {errors: [err], node: null}}}},
                toTree
            })

            assert.strictEqual(res.node.salt?.errors[0], err)
        })
    })

    describe('one of hash and salt is json-invalid and name is json-invald', () => {
        it('returned errors contain both validateBSON-generated errors and ajv-generated error', () => {
            const err = "some error"

            const res = validate({name: "abc", hash: new Binary('abc'), salt: 5}, {
                validate: _validate,
                validateBSON: () => {return {node: {salt: {errors: [err], node: null}}}},
                toTree
            })

            const keys = Object.keys(res.node)

            assert(
                keys.length === 2 &&
                keys.includes('name') && keys.includes('salt') &&
                
                res.node.salt.errors.length === 1 && 
                res.node.salt.errors[0] === err
            )
        })
    })
}

function testValidateBSON() {
    describe('hash - wrong type; salt - empty', () => {
        it('returns both errors', () => {
            const res = _validateBSON({hash: undefined, salt: ''})

            const keys = Object.keys(res.node)
            
            assert(
                keys.length === 2 &&
                keys.includes('hash') && keys.includes('salt') &&

                res.node.hash.errors.length === 1 &&
                m.TypeErrorMsg.code === res.node.hash.errors[0].code &&

                res.node.salt.errors.length === 1 &&
                m.ValidationError.code === res.node.salt.errors[0].code
            )
        })
    })

    describe('hash - wrong type, salt - invalid binData', () => {
        it('returns both errors', () => {
            const res = _validateBSON({hash: undefined, salt: 5})

            const keys = Object.keys(res.node)
            
            assert(
                keys.length === 2 &&
                keys.includes('hash') && keys.includes('salt') &&

                res.node.hash.errors.length === 1 &&
                m.TypeErrorMsg.code === res.node.hash.errors[0].code &&

                res.node.salt.errors.length === 1 &&
                res.node.salt.errors[0].data instanceof BSONTypeError
            )
        })
    })
}

export {testValidate, testValidateBSON}