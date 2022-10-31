import {validateObjectId, containsId} from '../helpers.js'
import {validate} from './validate.js'

import {
  _storeCreate, _storeUpdate, _storeDelete, _storeGetById,
} from './store.js'

import {
    _create, _update, _delete, _getById
} from './controllers.js'

function Product(c) {
    function storeCreate(fields) {
        return _storeCreate(fields, {c})
    }

    function storeUpdate(id, fields) {
        return _storeUpdate(id, fields, {c})
    }

    function storeDelete(id) {
        return _storeDelete(id, {c})
    }

    function storeGetById(id) {
        return _storeGetById(id, {c})
    }

    return {
        getById: async (id) => {
            return _getById(id, {getById: storeGetById, validateObjectId})
        },

        create: async (fields) => {
            return _create(fields, {create: storeCreate, validate})
        },

        update: async (id, fields) => {
            return _update(id, fields, {update: storeUpdate, getById: storeGetById, validate, validateObjectId, containsId})
        },

        delete: async (id) => {
            return _delete(id, {storeDelete, validateObjectId})
        }
    }
}

export default Product
