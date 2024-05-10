import { assert } from 'chai'
import { ObjectId, Binary } from 'bson'

import * as m from '../../../e-commerce-common/messages.js'
import { ValidationError, ValueNotUnique, ValidationConflict } from '../../src/helpers.js'

import { _create, _getById, _getByName } from '../../src/auth/controllers.js'

function testCreate() {
  describe('called', () => {
    it('create cb is called with data returned by generateHash', async () => {
      const data = 'some data'
      let isEqual = false

      await _create(
        { password: 'some pswd' },
        {
          generateHash: () => {
            return { someProp: data }
          },
          create: async _data => {
            isEqual = data === _data.someProp
          },
        }
      )

      assert.strictEqual(isEqual, true)
    })
  })

  describe("'create' cb returns", () => {
    it("returns the value, returned by 'create' cb", async () => {
      const data = 'some data'
      const res = await _create(
        {},
        {
          generateHash: () => {},
          create: async () => {
            return data
          },
        }
      )

      assert.strictEqual(res, data)
    })
  })

  describe("'create' cb throws ValidationError", () => {
    it('throws ValidationError message', async () => {
      try {
        await _create(
          {},
          {
            generateHash: () => {},
            create: async () => {
              throw new ValidationError()
            },
          }
        )
      } catch (e) {
        return assert.strictEqual(e.code, m.ValidationError.code)
      }

      assert.fail("didn't throw")
    })
  })

  describe("'create' cb throws ValueNotUnique", async () => {
    it('throws ResourceExists with proper tree', async () => {
      const fieldName = 'name'

      try {
        await _create(
          {},
          {
            create: async () => {
              throw new ValueNotUnique('some message', { field: fieldName })
            },
            generateHash: () => {},
          }
        )
      } catch (e) {
        return assert(
          fieldName in e.tree.node &&
            e.tree.node[fieldName].errors.length === 1 &&
            e.tree.node[fieldName].errors[0].code === m.ValidationError.code
        )
      }

      assert.fail("didn't throw")
    })
  })
}

function testGetById() {
  describe('is passed an id', () => {
    it('passes the id to validateObjectId', async () => {
      const id = new ObjectId()
      let isEqual = null

      await _getById(id, {
        validateObjectId: _id => {
          isEqual = id === _id
        },
        getById: async () => {
          return { name: 'name', _id: 'id' }
        },
      })

      assert.strictEqual(isEqual, true)
    })
  })

  describe('validateObjectId returns truthy', () => {
    it('throws InvalidCriterion with the returned value as data', async () => {
      const idE = 'an error with id'

      try {
        await _getById('', {
          validateObjectId: () => {
            return idE
          },
          getById: async () => {},
        })
      } catch (e) {
        return assert(
          // error is an InvalidCriterion
          m.InvalidCriterion.code === e.code && idE === e.data
        )
      }

      assert.fail("_getById didn't throw")
    })

    it("doesn't call any other dependencies", async () => {
      const getByIdCalls = []

      try {
        await _getById('', {
          validateObjectId: () => {
            return idE
          },
          getById: async () => {
            getByIdCalls.push(null)
          },
        })
      } catch (e) {
        return assert.strictEqual(getByIdCalls.length, 0)
      }

      assert.fail("_getById didn't throw")
    })
  })

  describe('validateObjectId returns falsy', () => {
    it("calls 'getById' cb", async () => {
      let isCalled = false

      await _getById(new ObjectId(), {
        validateObjectId: () => false,
        getById: () => {
          isCalled = true
          return { name: 'name', _id: 'id' }
        },
      })

      assert.strictEqual(isCalled, true)
    })

    it("passes instance of ObjectId to 'getById'", async () => {
      let isInstance = false

      await _getById(new ObjectId().toString(), {
        validateObjectId: () => false,
        getById: id => {
          isInstance = id instanceof ObjectId
          return { name: 'name', _id: 'id' }
        },
      })

      assert.strictEqual(isInstance, true)
    })

    it("passes to 'getById' it's input id", async () => {
      const id = new ObjectId()
      let isEqual = false

      await _getById(id, {
        validateObjectId: () => false,
        getById: _id => {
          isEqual = id.toString() === _id.toString()
          return { name: 'name', _id: 'id' }
        },
      })

      assert.strictEqual(isEqual, true)
    })
  })

  describe("'getById' returns data", () => {
    it('returns the same data', async () => {
      const dataExpected = { name: 'some name', id: 'some id' }

      const res = await _getById(new ObjectId(), {
        validateObjectId: () => false,
        getById: () => {
          return { name: dataExpected.name, _id: dataExpected.id }
        },
      })

      assert.deepEqual(res, dataExpected)
    })
  })
}

function testGetByName() {
  describe('is called with arguments', () => {
    it("calls getByName with the 'name'", async () => {
      const name = 'name'
      let isEqual = false

      await _getByName(name, 'some psswd', {
        getByName: async _name => {
          isEqual = name === _name
          return { hash: new Binary('whatev'), salt: new Binary('whatev') }
        },
        isEqualHash: () => true,
      })

      assert.strictEqual(isEqual, true)
    })
  })

  describe('getByName returns Binary data', () => {
    it('calls isEqualHash with the data', async () => {
      const salt = new Binary('abc'),
        hash = new Binary('def')
      let isEqual = false

      await _getByName('name', 'psswd', {
        getByName: () => {
          return { salt, hash }
        },
        isEqualHash: (_salt, _hash) => {
          isEqual = salt.buffer === _salt && hash.buffer === _hash
          return true
        },
      })

      assert.strictEqual(isEqual, true)
    })
  })

  describe('isEqualHash returns falsy', () => {
    it('throws InvalidCriterion', async () => {
      try {
        await _getByName('name', 'psswd', {
          getByName: () => {
            return { hash: new Binary('whatev'), salt: new Binary('whatev') }
          },
          isEqualHash: (_salt, _hash) => false,
        })
      } catch (e) {
        return assert.strictEqual(e.code, m.InvalidCriterion.code)
      }

      assert.fail("didn't throw")
    })
  })

  describe('isEqualHash returns truthy', () => {
    it('returns data from getByName', async () => {
      const _id = 'id',
        name = 'name',
        hash = new Binary('whatev'),
        salt = new Binary('whatev')

      const res = await _getByName('whatev', 'psswd', {
        getByName: () => {
          return { _id, name, hash, salt }
        },
        isEqualHash: () => true,
      })

      assert.deepEqual(res, { name, id: _id })
    })
  })
}

export { testCreate, testGetById, testGetByName }
