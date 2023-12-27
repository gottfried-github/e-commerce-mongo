import {validateObjectId, containsId} from '../helpers.js'

import {
  _storeCreate, _storeUpdate, _storeAddPhotos, _storeDelete, _storeGetById, _storeGetByIdRaw, _storeGetMany
} from './store.js'

import {
    _create, _update, _addPhotos, _delete, _getById, _getMany
} from './controllers.js'

function Product({client, product, photos}) {
    function storeCreate(fields) {
        return _storeCreate(fields, {c: product})
    }

    function storeUpdate(id, fields) {
        return _storeUpdate(id, fields, {c: product})
    }

    function storeAddPhotos(id, _photos) {
        return _storeAddPhotos(id, _photos, {client, photo: photos, product})
    }

    function storeDelete(id) {
        return _storeDelete(id, {c: product})
    }

    function storeGetById(id) {
        return _storeGetById(id, {c: product})
    }

    function storeGetByIdRaw(id) {
        return _storeGetByIdRaw(id, {c: product})
    }

    function storeGetMany(expose, inStock, sortOrder) {
        return _storeGetMany(expose, inStock, sortOrder, {c: product})
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

        addPhotos: (id, photos) => {
            return _addPhotos(id, photos, {addPhotos: storeAddPhotos, validateObjectId})
        },

        delete: async (id) => {
            return _delete(id, {storeDelete, validateObjectId})
        }
    }
}

export default Product
