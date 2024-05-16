import { testCreate, testGetById, testGetByName } from './auth_controllers.js'

describe('controllers', () => {
  describe('_create', () => {
    testCreate()
  })

  describe('_getById', () => {
    testGetById()
  })

  describe('_getByName', () => {
    testGetByName()
  })
})
