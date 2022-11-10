import {assert} from 'chai'
import {ObjectId} from 'mongodb'
import {BSONTypeError} from 'bson'
import {isValidBadInputTree} from '../../../fi-common/helpers.js'

import {testJSONErrors} from './product-validate_testJSONErrors.js'

import {validate} from "../../src/product/validate.js"

const testsJSON = {
    exposeRequired: [{
        i: [{}],
        o: validate,
        description: "missing expose and no fields"
    }],
    exposeType: [{
        i: [{expose: 5}],
        o: validate,
        description: "invalid expose and no fields"
    }],
    exposeRequiredNameType: [{
        i: [{name: 5}],
        o: validate,
        description: "missing expose and invalid name: shouldn't contain 'required' error for itemInitial - see Which errors to report"
    }],
    exposeNameType: [{
        i: [{expose: 5, name: 5}],
        o: validate,
        description: "invalid expose and invalid name: shouldn't contain 'required' error for itemInitial - see Which errors to report"
    }],
    nameTypePriceRequired: [{
        i: [{
            expose: true, name: 5,
            is_in_stock: false, photos: ['some/url'], cover_photo: 'some/url', description: "some description"
        }],
        o: validate,
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
            assert.throws(() => {validate({expose: false, irrelevantProperty: true})}, Error, "data contains fields, not defined in the spec")
        })
    })

    describe("valid data", () => {
        it("returns valid bad input errors", () => {
            const errors = validate({expose: true, name: 5})
            assert.strictEqual(isValidBadInputTree(errors), true)
        })
    })
}

export {testValidate}
