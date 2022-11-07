import {generateHash, isEqualHash} from './helpers.js'
import {validateObjectId} from '../helpers.js'

import {validate} from './validate.js'

import {_storeCreate, _storeUpdate, _storeDelete, _storeGetById, _storeGetByName} from './store.js'
import {_create, _getById, _getByName} from './controllers.js'

function Auth(c) {
    function storeCreate(fields) {
        return _storeCreate(fields, {c})
    }

    function storeGetById(id) {
        return _storeGetById(id, {c})
    }

    function storeGetByName(name) {
        return _storeGetByName(name, {c})
    }

    return {
        create: (id, fields) => {
            return _create(id, fileds, {create: storeCreate, validate, generateHash})
        },

        getById: (id) => {
            return _getById(id, {getById: storeGetById, validateObjectId})
        },

        getByName: (name, password) => {
            return _getByName(name, password, {getByName: storeGetByName, isEqualHash})
        }
    }
}

export default Auth