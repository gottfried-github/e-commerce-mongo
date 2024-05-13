import { validateObjectId, containsId } from '../helpers.js'

import {
  _storeCreate,
  _storeUpdate,
  _storeAddPhotos,
  _storeRemovePhotos,
  _storeReorderPhotos,
  _storeUpdatePhotosPublicity,
  _storeGetPhotos,
  _storeSetCoverPhoto,
  _storeDelete,
  _storeGetById,
  _storeGetByIdRaw,
  _storeGetMany,
} from './store.js'

import {
  _create,
  _update,
  _addPhotos,
  _removePhotos,
  _reorderPhotos,
  _updatePhotosPublicity,
  _getPhotos,
  _setCoverPhoto,
  _delete,
  _getById,
  _getMany,
} from './controllers.js'

function Product({ client, product, photos }) {
  function storeCreate(fields) {
    return _storeCreate(fields, { c: product })
  }

  function storeUpdate(id, fields) {
    return _storeUpdate(id, fields, { product, photo: photos })
  }

  function storeAddPhotos(id, _photos) {
    return _storeAddPhotos(id, _photos, { client, photo: photos, product })
  }

  function storeRemovePhotos(productId, photosIds) {
    return _storeRemovePhotos(productId, photosIds, { client, product, photo: photos })
  }

  function storeReorderPhotos(productId, _photos) {
    return _storeReorderPhotos(productId, _photos, { client, product, photo: photos })
  }

  function storeUpdatePhotosPublicity(productId, _photos) {
    return _storeUpdatePhotosPublicity(productId, _photos, { client, product, photo: photos })
  }

  function storeGetPhotos(productId, publicPhotos) {
    return _storeGetPhotos(productId, publicPhotos, { photo: photos })
  }

  function storeSetCoverPhoto(productId, photo) {
    return _storeSetCoverPhoto(productId, photo, { client, product, photoC: photos })
  }

  function storeDelete(id) {
    return _storeDelete(id, { client, product, photo: photos })
  }

  function storeGetById(id) {
    return _storeGetById(id, { c: product })
  }

  function storeGetByIdRaw(id) {
    return _storeGetByIdRaw(id, { c: product })
  }

  function storeGetMany(expose, inStock, sortOrder) {
    return _storeGetMany(expose, inStock, sortOrder, { c: product })
  }

  return {
    getById: async id => {
      return _getById(id, { getById: storeGetById, validateObjectId })
    },

    getMany: async (expose, inStock, sortOrder) => {
      return _getMany(expose, inStock, sortOrder, { getMany: storeGetMany })
    },

    create: async fields => {
      return _create(fields, { create: storeCreate })
    },

    update: async (id, fields) => {
      return _update(id, fields, { update: storeUpdate, validateObjectId, containsId })
    },

    addPhotos: (id, photos) => {
      return _addPhotos(id, photos, { addPhotos: storeAddPhotos, validateObjectId })
    },

    removePhotos: (productId, photosIds) => {
      return _removePhotos(productId, photosIds, {
        removePhotos: storeRemovePhotos,
        validateObjectId,
      })
    },

    reorderPhotos: (productId, photos) => {
      return _reorderPhotos(productId, photos, {
        reorderPhotos: storeReorderPhotos,
        validateObjectId,
      })
    },

    updatePhotosPublicity: (productId, photos) => {
      return _updatePhotosPublicity(productId, photos, {
        updatePhotosPublicity: storeUpdatePhotosPublicity,
        validateObjectId,
      })
    },

    getPhotos: (productId, publicPhotos) => {
      return _getPhotos(productId, publicPhotos, {
        getPhotos: storeGetPhotos,
        validateObjectId,
      })
    },

    setCoverPhoto: (productId, photo) => {
      return _setCoverPhoto(productId, photo, {
        setCoverPhoto: storeSetCoverPhoto,
        validateObjectId,
      })
    },

    delete: async id => {
      return _delete(id, { storeDelete, validateObjectId })
    },
  }
}

export default Product
