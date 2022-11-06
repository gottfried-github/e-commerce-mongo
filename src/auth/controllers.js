import {ObjectId} from 'bson'

import * as m from '../../../bazar-common/messages.js'
import {ValidationError, ValidationConflict, ValueNotUnique} from '../helpers.js'

import {generateHash, isEqualHash} from './helpers.js'
import {validate} from './validate.js'

/**
 * TODO: see "`create`: validate password before writing" and "`create`: binData validation in additional validation"
 * 
*/
async function _create(fields, {create, validate, generateHash}) {
    const data = {name: fields.name, ...generateHash(fields.password)}

    let id = null
    try {
        id = await create(data)
    } catch(e) {
        if (e instanceof ValidationError) {
            const errors = validate(data)
            
            if (!errors) {
                const _e = new ValidationConflict("credentials pass additional validation but builtin validation fails")
                _e.data = e
                throw _e
            }

            throw errors
        }

        if (e instanceof ValueNotUnique) {
            const errors = {errors: [], node: {[e.data.field || 'unknown']: {errors: [m.ValidationError.create(e.message, e)], node: null}}}

            throw errors
        }

        throw e
    }

    return id
}

async function _update() {

}

async function _delete() {
    
}

async function _getById(id, {getById, validateObjectId}) {
    const idE = validateObjectId(id)
    if (idE) throw m.InvalidCriterion.create(idE.message, idE)

    const {name, _id} = await getById(new ObjectId(id))
    
    // see User store in bazar-api
    return {name, id: _id}
}

async function _getByName(name, password, {getByName, isEqualHash}) {
    const doc = await getByName(name)

    // see Exposing password data
    if (!isEqualHash(doc.salt.buffer, doc.hash.buffer, password)) throw m.InvalidCriterion.create("password is incorrect")

    // see User store in bazar-api
    return {name: doc.name, id: doc._id}
}

export {
    _create,
    _update,
    _delete,
    _getById,
    _getByName,
}