import {toTree} from 'ajv-errors-to-data-tree'
import {testJSONErrors} from './product-validate_testJSONErrors.js'

import {filterErrors, _validate} from '../src/product/validate.js'

function testFilterErrors() {
    const tests = {
        isInSaleRequired: [{
            i: [((data) => {
                _validate(data)
                // console.log("filterErrors tests, isInSaleRequired, i - data:", data);
                return toTree(_validate.errors)
            })({})],
            o: (errors) => {filterErrors(errors); return errors},
            description: "missing isInSale and no fields. See 1 in Filtering out irrelevant errors"
        }],
        isInSaleType: [{
            i: [((data) => {
                _validate(data)
                return toTree(_validate.errors)
            })({isInSale: 5})],
            o: (errors) => {filterErrors(errors); return errors},
            description: "invalid isInSale and no fields. See 1 in Filtering out irrelevant errors"
        }],
        isInSaleRequiredNameType: [{
            i: [((data) => {
                _validate(data)
                return toTree(_validate.errors)
            })({name: 5})],
            o: (errors) => {filterErrors(errors); return errors},
            description: "missing isInSale and invalid name. See 1 in Filtering out irrelevant errors"
        }],
        isInSaleNameType: [{
            i: [((data) => {
                _validate(data)
                return toTree(_validate.errors)
            })({isInSale: 5, name: 5})],
            o: (errors) => {filterErrors(errors); return errors},
            description: "invalid isInSale and invalid name. See 1 in Filtering out irrelevant errors"
        }],
        nameTypeItemInitialRequired: [{
            i: [((data) => {
                _validate(data)
                return toTree(_validate.errors)
            })({isInSale: true, name: 5})],
            o: (errors) => {filterErrors(errors); return errors},
            description: "true isInSale and invalid name. See 2 in Filtering out irrelevant errors"
        }],
    }

    testJSONErrors(tests)
}

export {testFilterErrors}
