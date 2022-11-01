const VALIDATION_FAIL_MSG = "data validation failed"
class InvalidData extends Error {constructor(message, data, ...args) {super(message, ...args); this.data = data}}

async function _storeCreate(fields, {c}) {
    let res = null

    try {
        res = await c.insertOne(fields)
    } catch(e) {
        if (121 === e.code) e = new InvalidData(VALIDATION_FAIL_MSG, e)
        throw e
    }

    return res.insertedId
}

/**
    @param {id, in Types} id
*/
async function _storeUpdate(id, fields, {c}) {
    let res = null
    try {
        res = await c.updateOne({_id: id}, {$set: fields}, {upsert: false})
    } catch(e) {
        if (121 === e.code) e = new InvalidData(VALIDATION_FAIL_MSG, e)
        throw e
    }

    if (!res.matchedCount) return null
    if (!res.modifiedCount) return false
    // if (!res.matchedCount) throw m.ResourceNotFound.create("the given id didn't match any products")

    return true
}

async function _storeDelete(id, {c}) {
    const res = await c.deleteOne({_id: id})
    if (0 === res.deletedCount) return null
    return true
}

async function _storeGetById(id, {c}) {
    const res = await c.findOne({_id: id})
    return res
}

export {_storeCreate, _storeUpdate, _storeDelete, _storeGetById, InvalidData}
