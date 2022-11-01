class InvalidData extends Error {constructor(message, data, ...args) {super(message, ...args); this.data = data}}

async function _storeGetById(id) {
    const res = await c.findOne({_id: id})
    return res
}

async function _storeGetByName(name) {
    const res = await c.findOne({name: name})
    return res
}

async function _storeCreate(fields, {db}) {
    let res = null
    try {
        res = db.insertOne(fields)
    } catch(e) {
        if (121 === e.code) throw new InvalidData("invalid data", e)
        if (11000 === e.code) throw NotUnique.create(['name'], "username already exists")
    }

    return res.insertedId
}

async function _storeDelete() {

}

export {
    _storeGetById,
    _storeGetByName,
    _storeCreate,
    _storeDelete,
}
