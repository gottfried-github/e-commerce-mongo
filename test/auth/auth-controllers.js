import {testCreate, testGetById} from './auth_controllers.js'

describe('controllers', () => {
    describe('_create', () => {
        testCreate()
    })

    describe('_getById', () => {
        testGetById()
    })
})