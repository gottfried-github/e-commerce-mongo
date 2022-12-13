import {ValidationError} from '../helpers.js'

async function _storeCreateMany(fields, {c}) {
    let res = null

    try {
        res = await c.insertMany(fields)
    } catch(e) {
        if (121 === e.code) throw new ValidationError(VALIDATION_FAIL_MSG, {
            index: e.writeErrors[0].err.index,
            err: e
        })

        throw e
    }

    return Object.keys(res.insertedIds).map(k => res.insertedIds[k])
}

export {_storeCreateMany}