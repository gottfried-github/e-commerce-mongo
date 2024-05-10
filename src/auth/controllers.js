import { ObjectId } from 'bson'

import * as m from '../../../e-commerce-common/messages.js'
import { ValidationError, ValidationConflict, ValueNotUnique } from '../helpers.js'

/**
 * TODO: see "`create`: validate password before writing" and "`create`: binData validation in additional validation"
 *
 */
// async function _create(fields, {create, generateHash}) {
//     const data = {name: fields.name, ...generateHash(fields.password)}

//     let id = null
//     try {
//         id = await create(data)
//     } catch(e) {
//         if (e instanceof ValidationError) {
//             throw m.ValidationError.create("mongoDB builtin validation failed", null, e.data)
//         }

//         if (e instanceof ValueNotUnique) {
//             const errors = {errors: [], node: {[e.data.field || 'unknown']: {errors: [m.ValidationError.create(e.message, e)], node: null}}}

//             throw m.ResourceExists.create("value already exists", errors)
//         }

//         throw e
//     }

//     return id
// }

// async function _update() {

// }

// async function _delete() {

// }

async function _getById(id, { getById, validateObjectId }) {
  const idE = validateObjectId(id)
  if (idE) throw m.InvalidCriterion.create(idE.message, idE)

  const doc = await getById(new ObjectId(id))

  if (null === doc) return null

  const { name, _id } = doc

  // see User store in bazar-api
  return { name, id: _id }
}

async function _getByName(name, password, { getByName, isEqualHash }) {
  const doc = await getByName(name)

  if (null === doc) return null

  // see Exposing password data
  if (!isEqualHash(doc.salt.buffer, doc.hash.buffer, password))
    throw m.InvalidCriterion.create('password is incorrect')

  // see User store in bazar-api
  return { name: doc.name, id: doc._id }
}

export { _getById, _getByName }
