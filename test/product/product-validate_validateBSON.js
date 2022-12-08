import { resolveSchema } from 'ajv/dist/compile/index.js'
import { assert } from 'chai'
import {_validateBSON} from '../../src/product/validate.js'

function testValidateBSON() {
    describe("passed data", () => {
        it("calls validateObjectId", () => {
            let isCalled = null

            _validateBSON({photos_all: ['some id']}, {validateObjectId: () => {
                isCalled = true
                 
                return null
            }})

            assert.strictEqual(isCalled, true)
        })

        it("calls validateObjectId with the data", () => {
            const data = 'some id'
            let isEqual = null

            _validateBSON({photos_all: [data]}, {validateObjectId: (_data) => {
                isEqual = data === _data
                
                return null
            }})

            assert.strictEqual(isEqual, true)
        })
        
        it("calls validateObjectId with the data", () => {
            const data = 'some id'
            let isEqual = null

            _validateBSON({photos: [data]}, {validateObjectId: (_data) => {
                isEqual = data === _data
                
                return null
            }})

            assert.strictEqual(isEqual, true)
        })
        
        it("calls validateObjectId with the data", () => {
            const data = 'some id'
            let isEqual = null

            _validateBSON({cover_photo: data}, {validateObjectId: (_data) => {
                isEqual = data === _data
                
                return null
            }})

            assert.strictEqual(isEqual, true)
        })
    })

    describe("validateObjectId returns null", () => {
        it("returns null", () => {
            const res = _validateBSON({cover_photo: 'some id'}, {
                validateObjectId: () => null
            })

            assert.strictEqual(res, null)
        })
    })

    describe("validateObjectId returns truthy", () => {
        it("returns error tree containing the returned value", () => {
            const id = 'an id'

            const res = _validateBSON({photos_all: ['an id']}, {
                validateObjectId: (_id) => _id
            })

            assert(
                res.node?.photos_all && 
                1 === res.node.photos_all.node[0].errors.length &&
                id === res.node.photos_all.node[0].errors[0].data, 
                "should contain only an error with the value"
            )
        })
    })
}

export {testValidateBSON}