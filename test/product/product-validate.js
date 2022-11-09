import {testFilterErrors} from './product-validate_filter-errors.js'
import {testValidateBSON} from './product-validate_validateBSON.js'
import {testValidate} from './product-validate_validate.js'

describe("filterErrors", () => {
    testFilterErrors()
})

describe("_validateBSON", () => {
    testValidateBSON()
})

describe("validate", () => {
    testValidate()
})
