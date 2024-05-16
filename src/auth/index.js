import { isEqualHash } from './helpers.js'
import { validateObjectId } from '../helpers.js'

import { _storeGetById, _storeGetByName } from './store.js'
import { _getById, _getByName } from './controllers.js'

function Auth(c) {
  // function storeCreate(fields) {
  //     return _storeCreate(fields, {c})
  // }

  function storeGetById(id) {
    return _storeGetById(id, { c })
  }

  function storeGetByName(name) {
    return _storeGetByName(name, { c })
  }

  return {
    // create: (fields) => {
    //     return _create(fields, {create: storeCreate, generateHash})
    // },

    getById: id => {
      return _getById(id, { getById: storeGetById, validateObjectId })
    },

    getByName: (name, password) => {
      return _getByName(name, password, { getByName: storeGetByName, isEqualHash })
    },
  }
}

export default Auth
