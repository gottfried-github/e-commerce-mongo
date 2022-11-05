import {Binary} from 'bson'
import {assert} from 'chai'

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
}

export {testValidate}