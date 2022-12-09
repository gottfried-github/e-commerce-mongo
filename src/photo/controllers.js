import * as m from '../../../fi-common/messages.js'
import {ValidationConflict, ValidationError} from '../helpers.js'

import {_storeCreateMany} from "./store"

/**
 * @param {Array} fields array of fields objects
*/
async function _createMany(fields) {
    let res = null
    
    try {
        res = await _storeCreateMany(fields)
    } catch(e) {
        if (e instanceof ValidationError) {
            const errors = validate(fields[e.data.index])

            if (!errors) throw new ValidationConflict()

            throw m.ValidationError.create('some documents failed validation', [{
                index: e.data.index,
                errors: [],
                node: errors.node
            }])
        }
    }

    return res
}