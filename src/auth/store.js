import {InvalidData} from '../helpers.js'

async function _storeCreate(fields, {c}) {
    let res = null
    try {
        res = await c.insertOne(fields)
    } catch(e) {
        if (121 === e.code) throw new InvalidData("invalid data", e)
        if (11000 === e.code) throw NotUnique.create(['name'], "username already exists")
    }

    return res.insertedId
}

async function _storeUpdate() {

}

async function _storeDelete() {

}

async function _storeGetById(id, {c}) {
    const res = await c.findOne({_id: id})
    return res
}

async function _storeGetByName(name, {c}) {
    const res = await c.findOne({name: name})
    return res
}

export {
    _storeCreate,
    _storeDelete,
    _storeUpdate,
    _storeGetById,
    _storeGetByName,
}
