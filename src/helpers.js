import { ObjectId } from 'mongodb'
import { traverseTree } from 'ajv-errors-to-data-tree/src/helpers.js'
import * as m from '../../e-commerce-common/messages.js'

class ValidationError extends Error {
  constructor(message, data, ...args) {
    super(message, ...args)
    this.data = data
  }
}
class ValidationConflict extends Error {
  constructor(message, data, ...args) {
    super(message, ...args)
    this.data = data
  }
}
class ValueNotUnique extends Error {
  constructor(message, data, ...args) {
    super(message, ...args)
    this.data = data
  }
}

// see do validation in a specialized method
function validateObjectId(id) {
  if ([null, undefined].includes(id)) return new Error(`id cannot be null or undefined`)

  try {
    new ObjectId(id)
  } catch (e) {
    return e
  }

  return null
}

// see do validation in a specialized method
function containsId(data) {
  return '_id' in data ? '_id' : false
}

export { validateObjectId, containsId, ValidationError, ValidationConflict, ValueNotUnique }
