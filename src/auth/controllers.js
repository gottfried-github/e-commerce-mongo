import {generateHash} from './helpers.js'
import {InvalidData} from '../helpers.js'

async function _create(fields, {create}) {
    // see create: validation logic
    const errors = credentials(fields)
    if (errors) throw errors

    const data = {name: fields.name, ...generateHash(fields.password)}

    let id = null
    try {
        id = await storeCreate(data)
    } catch(e) {
        // this must mean the encrypted data is invalid
        if (e instanceof InvalidData) {
            const _e = new Error("credentials pass additional validation but builtin validation fails")
            _e.data = e
            e = _e
        }

        throw e
    }

    return id
}

async function _update() {

}

async function _delete() {
    
}

async function _getById(id, {getById}) {
    const idE = validateObjectId(id)
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    const {name, _id} = await getById(id)
    // see User store in bazar-api
    return {name, id: _id}
}

async function _getByName(name, password, {getByName}) {
    const doc = await getByName(name)

    // see Exposing password data
    if (!isEqualHash(doc.salt.buffer, doc.hash.buffer, password)) throw m.InvalidCriterion.create("password is incorrect")

    // see User store in bazar-api
    return {name, id: _id}
}