import {Binary} from 'bson'
import {assert} from 'chai'

import {toTree} from 'ajv-errors-to-data-tree'

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
}

export {testValidate}