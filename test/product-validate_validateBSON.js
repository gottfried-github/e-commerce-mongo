import {ObjectId} from 'mongodb'

import {testBSONErrors} from './product-validate_testBSONErrors.js'
import {_validateBSON} from '../src/product/validate.js'

const id = "an invalid id"

function testValidateBSON() {
    const tests = {
        singleCorrectError: [
            {
                i: [{itemInitial: id}],
                o: _validateBSON,
                description: "itemInitial is an invalid string objectId",
                erroneousFieldname: 'itemInitial',
                erroneousValue: id
            },
            {
                i: [{itemInitial: new ObjectId(), _id: id}],
                o: _validateBSON,
                description: "itemInitial is valid, _id is an invalid string objectId",
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
                i: [{itemInitial: new ObjectId().toString()}],
                o: _validateBSON,
                description: "itemInitial is a valid string objectId"
            },
            {
                i: [{}],
                o: _validateBSON,
                description: "itemInitial not set"
            }
        ]
    }

    testBSONErrors(tests)
}

export {testValidateBSON}
