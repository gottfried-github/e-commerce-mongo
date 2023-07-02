import * as m from '../../../e-commerce-common/messages.js'
import {ValidationConflict, ValidationError} from '../helpers.js'

/**
 * @param {Array} fields array of fields objects
*/
async function _createMany(fields, {createMany}) {
    let res = null
    
    try {
        res = await createMany(fields)
    } catch(e) {
        if (e instanceof ValidationError) throw m.ValidationError.create("mongoDB built-in validation failed", null, e)

        throw e
    }

    return res
}

export {_createMany}