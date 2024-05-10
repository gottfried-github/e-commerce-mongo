import { testCreate } from './product_create.js'
import { testUpdate } from './product_update.js'
import { testUpdatePhotos } from './product_updatePhotos.js'
import { testGetById } from './product_getById.js'
import { testDelete } from './product_delete.js'

describe('_create', () => {
  testCreate()
})

describe('_update', () => {
  testUpdate()
})

describe('_updatePhotos', () => {
  testUpdatePhotos()
})

describe('_delete', () => {
  testDelete()
})

describe('_getById', () => {
  testGetById()
})
