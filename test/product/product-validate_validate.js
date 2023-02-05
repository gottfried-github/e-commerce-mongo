import {ObjectId} from 'mongodb'
import {BSONTypeError} from 'bson'
import {assert} from 'chai'

import * as m from '../../../fi-common/messages.js'
import {isValidBadInputTree} from '../../../fi-common/helpers.js'

import {_validate} from "../../src/product/validate.js"

import {testJSONErrors} from './product-validate_testJSONErrors.js'

const testsJSON = {
    exposeRequired: [{
        i: [{}],
        o: (fields) => {return _validate(fields, {validateBSON: () => null})},
        description: "missing expose and no fields"
    }],
    exposeType: [{
        i: [{expose: 5}],
        o: (fields) => {return _validate(fields, {validateBSON: () => null})},
        description: "invalid expose and no fields"
    }],
    exposeRequiredNameType: [{
        i: [{name: 5}],
        o: (fields) => {return _validate(fields, {validateBSON: () => null})},
        description: "missing expose and invalid name: shouldn't contain 'required' error for itemInitial - see Which errors to report"
    }],
    exposeNameType: [{
        i: [{expose: 5, name: 5}],
        o: (fields) => {return _validate(fields, {validateBSON: () => null})},
        description: "invalid expose and invalid name: shouldn't contain 'required' error for itemInitial - see Which errors to report"
    }],
    nameTypePriceRequired: [{
        i: [{
            expose: true, name: 5,
            is_in_stock: false, photos: ['some/url'], cover_photo: 'some/url', description: "some description"
        }],
        o: (fields) => {return _validate(fields, {validateBSON: () => null})},
        description: "true expose and invalid name: should contain 'required' error for itemInitial - the case is implied in Which errors to report"
    }],
}

const id = "an invalid id"

function testValidate() {
    describe("JSON validate data", () => {
        testJSONErrors(testsJSON)
    })

    describe("data contains fields, not defined in the spec (see Which errors should not occur in the data)", () => {
        it("throws an appropriate error", () => {
            assert.throws(() => {_validate({expose: false, irrelevantProperty: true}, {validateBSON: () => null})}, Error, "data contains fields, not defined in the spec")
        })
    })

    describe("invalid data", () => {
        it("returns valid bad input errors", () => {
            const errors = _validate({expose: true, name: 5}, {validateBSON: () => null})
            assert.strictEqual(isValidBadInputTree(errors), true)
        })

        it("calls validateBSON", () => {
            let isCalled = null

            _validate({name: 5}, {validateBSON: () => {
                isCalled = true
                return null
            }})

            assert.strictEqual(isCalled, true)
        })
        
        it("calls validateBSON with the data", () => {
            const data = {name: 5}
            let dataPassed = null

            _validate(data, {validateBSON: (_data) => {
                dataPassed = _data
                return null
            }})

            assert.deepEqual(dataPassed, data)
        })
    })

    describe("passed JSON-valid data", () => {
        it("calls validateBSON", () => {
            let isCalled = null

            _validate({expose: false, name: 'John'}, {validateBSON: () => {
                isCalled = true
            }})

            assert.strictEqual(isCalled, true)
        })
    })

    describe("validateBSON returns errors", () => {
        it("returns a merger of JSON and BSON errors", () => {
            const res = _validate({name: 5}, {validateBSON: () => {
              return {errors: [], node: {
                cover_photo: {errors: [m.ValidationError.create('invalid objectId')], node: null} 
              }}
            }})

            assert(
                res.node.name && res.node.cover_photo,
                "should contain only an error for name and an error for cover_photo"
            )
        })
    })
}

export {testValidate}
