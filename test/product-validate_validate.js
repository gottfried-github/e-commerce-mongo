import {assert} from 'chai'
import {ObjectId} from 'mongodb'
import {BSONTypeError} from 'bson'
import {isValidBadInputTree} from '../../helpers.js'

import {testBSONErrors} from './product-validate_testBSONErrors.js'
import {testJSONErrors} from './product-validate_testJSONErrors.js'

import {validate} from "../src/product/validate.js"

const testsJSON = {
    isInSaleRequired: [{
        i: [{}],
        o: validate,
        description: "missing isInSale and no fields"
    }],
    isInSaleType: [{
        i: [{isInSale: 5}],
        o: validate,
        description: "invalid isInSale and no fields"
    }],
    isInSaleRequiredNameType: [{
        i: [{name: 5}],
        o: validate,
        description: "missing isInSale and invalid name: shouldn't contain 'required' error for itemInitial - see Which errors to report"
    }],
    isInSaleNameType: [{
        i: [{isInSale: 5, name: 5}],
        o: validate,
        description: "invalid isInSale and invalid name: shouldn't contain 'required' error for itemInitial - see Which errors to report"
    }],
    nameTypeItemInitialRequired: [{
        i: [{isInSale: true, name: 5}],
        o: validate,
        description: "true isInSale and invalid name: should contain 'required' error for itemInitial - the case is implied in Which errors to report"
    }],
}

const id = "an invalid id"

const testsBSON = {
    singleCorrectError: [
        {
            i: [{isInSale: false, itemInitial: id}],
            o: validate,
            description: "JSON-valid but BSON-invalid: itemInitial is an invalid string objectId",
            erroneousFieldname: 'itemInitial',
            erroneousValue: id
        },
        {
            i: [{isInSale: false, itemInitial: new ObjectId(), _id: id}],
            o: validate,
            description: "JSON-valid but BSON-invalid: _id is an invalid string objectId",
            erroneousFieldname: '_id',
            erroneousValue: id
        }
    ],
    // twoCorrectErrors: [{
    //     i: [{isInSale: false, itemInitial: id, _id: id}],
    //     o: validate,
    //     description: "JSON-valid but BSON-invalid: itemInitial is an invalid string objectId",
    //     erroneousFieldnames: ['itemInitial', '_id'],
    //     erroneousValues: [id, id]
    // }],
    returnsNull: [
        {
            i: [{isInSale: false, itemInitial: new ObjectId().toString()}],
            o: validate,
            description: "both JSON- and BSON-valid: itemInitial is a valid string objectId"
        },
        {
            i: [{isInSale: false, itemInitial: new ObjectId()}],
            o: validate,
            description: "itemInitial is a valid ObjectId objectId"
        }
    ]
}

function testValidate() {
    describe("JSON validate data", () => {
        testJSONErrors(testsJSON)
    })

    describe("BSON validate data", () => {
        testBSONErrors(testsBSON)
    })

    describe("mixed validation", () => {
        describe("both JSON- and BSON-invalid: invalid isInSale, invalid string objectId itemInitial", () => {
            it("contains ONLY a 'type' error for isInSale and a BSONTypeError for itemInitial", (() => {
                const id = "an invalid id"
                const errors = validate({isInSale: 5, itemInitial: id})

                // console.log('errors:', errors.node.isInSale.errors)
                try {
                    new ObjectId(id)
                } catch(e) {
                    const keys = Object.keys(errors.node)

                    assert(
                        // tree.node only includes the two fields
                        2 === keys.length && keys.includes('isInSale') && keys.includes('itemInitial')

                        // each field contains a single error
                        && 1 === errors.node.isInSale.errors.length && 'type' === errors.node.isInSale.errors[0].data.keyword && 1 === errors.node.itemInitial.errors.length

                        // the itemInitial error is correct
                        && errors.node.itemInitial.errors[0].data instanceof BSONTypeError && e.message === errors.node.itemInitial.errors[0].message
                    )
                }
            }))
        })
    })

    describe("data contains fields, not defined in the spec (see Which errors should not occur in the data)", () => {
        it("throws an appropriate error", () => {
            assert.throws(() => {validate({isInSale: false, irrelevantProperty: true})}, Error, "data contains fields, not defined in the spec")
        })
    })

    describe("valid data", () => {
        it("returns valid bad input errors", () => {
            const errors = validate({isInSale: true, itemInitial: "an invalid id"})
            assert.strictEqual(isValidBadInputTree(errors), true)
        })
    })
}

export {testValidate}
