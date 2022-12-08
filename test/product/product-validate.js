import {testFilterErrors} from './product-validate_filter-errors.js'
import {testValidate} from './product-validate_validate.js'
import {testValidateBSON} from './product-validate_validateBSON.js'

describe("filterErrors", () => {
    testFilterErrors()
})

describe("validateBSON", () => {
    testValidateBSON()
})

describe("validate", () => {
    testValidate()
})
