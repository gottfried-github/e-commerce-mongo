import {assert} from 'chai'

import {ObjectId} from 'mongodb'
import {BSONTypeError} from "bson"

import {_validateBSON} from '../src/product/validate.js'

// import {toTree} from 'ajv-errors-to-data-tree'
const id = "an invalid id"

function testBSONErrors(tests) {
    tests.singleCorrectError.forEach(t => {
        describe(t.description || "", () => {
            console.log(t)
            const errors = t.o(...t.i)
            console.log("errors:", errors)

            it("returns truthy", () => {
                assert(!!t.o(...t.i))
            })

            it("contains a single error, regarding itemInitial", () => {
                const errors = t.o(...t.i)
                assert(
                    // itemInitial is the only node and it has only one error
                    1 === Object.keys(errors.node).length && t.erroneousFieldname in errors.node && 1 === errors.node[t.erroneousFieldname].errors.length
                )
            })

            it("the error is the same as ObjectId's", () => {
                const errors = t.o(...t.i)

                try {
                    new ObjectId(t.erroneousValue)
                } catch(e) {
                    return assert(
                        // error is a BSONTypeError and is the same as the error thrown by ObjectId
                        errors.node[t.erroneousFieldname].errors[0] instanceof BSONTypeError
                        && e.message === errors.node[t.erroneousFieldname].errors[0].message
                    )
                }
            })
        })
    })

    tests.returnsNull.forEach(t => {
        describe(t.description || '', () => {
            it("returns null", () => {
                assert.strictEqual(t.o(...t.i), null)
            })
        })
    })
}

export {testBSONErrors}
