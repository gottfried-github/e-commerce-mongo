import {validateObjectId, containsId} from '../helpers.js'

import {
  _storeCreate, _storeUpdate, _storeUpdatePhotos, _storeDelete, _storeGetById, _storeGetByIdRaw, _storeGetMany
} from './store.js'

import {
    _create, _update, _updatePhotos, _delete, _getById, _getMany
} from './controllers.js'

function Product(c) {
    function storeCreate(fields) {
        return _storeCreate(fields, {c})
    }

    function storeUpdate(id, fields) {
        return _storeUpdate(id, fields, {c})
    }

    function storeUpdatePhotos(id, photos) {
        return _storeUpdatePhotos(id, photos, {c})
    }

    function storeDelete(id) {
        return _storeDelete(id, {c})
    }

    function storeGetById(id) {
        return _storeGetById(id, {c})
    }

    function storeGetByIdRaw(id) {
        return _storeGetByIdRaw(id, {c})
    }

    function storeGetMany(expose, inStock, sortOrder) {
        return _storeGetMany(expose, inStock, sortOrder, {c})
    }

    return {
        getById: async (id) => {
            return _getById(id, {getById: storeGetById, validateObjectId})
        },

        getMany: async (expose, inStock, sortOrder) => {
            return _getMany(expose, inStock, sortOrder, {getMany: storeGetMany})
        },

        create: async (fields) => {
            return _create(fields, {create: storeCreate})
        },

        update: async (id, fields) => {
            return _update(id, fields, {update: storeUpdate, validateObjectId, containsId})
        },

        updatePhotos: (id, photos) => {
            return _updatePhotos(id, photos, {updatePhotos: storeUpdatePhotos, validateObjectId})
        },

        delete: async (id) => {
            return _delete(id, {storeDelete, validateObjectId})
        }
    }
}

export default Product
