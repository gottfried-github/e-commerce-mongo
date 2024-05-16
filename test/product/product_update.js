import { assert } from 'chai'
import * as m from '../../../e-commerce-common/messages.js'

import { ValidationError } from '../../src/helpers.js'
import { _update } from '../../src/product/controllers.js'
import { ValidationConflict } from '../../src/helpers.js'

function testUpdate() {
  describe('is passed an id', () => {
    it("passes the 'id' argument to validateObjectId", async () => {
      const id = 'an id'
      let isEqual = null
      await _update(
        id,
        { write: {}, remove: [] },
        {
          update: async () => {
            return true
          },
          validateObjectId: _id => {
            isEqual = id === _id
          },
          containsId: () => {},
        }
      )

      assert.strictEqual(isEqual, true)
    })
  })

  describe('validateObjectId returns truthy', () => {
    it("throws InvalidCriterion with the returned value as data AND doesn't call any other dependencies", async () => {
      // see '`_product`, testing `_update`: the order of `validateObjectId` and `containsId` doesn't matter' for why I don't check whether containsId has been called
      const updateCalls = []
      const idE = 'a error with id'
      try {
        await _update(
          '',
          { write: {}, remove: [] },
          {
            update: async () => {
              updateCalls.push(null)
            },
            validateObjectId: () => {
              return idE
            },
            containsId: () => {
              return false
            },
          }
        )
      } catch (e) {
        return assert(
          // error is an InvalidCriterion
          m.InvalidCriterion.code === e.code &&
            idE === e.data &&
            // none of the other dependencies has been called
            [updateCalls.length].filter(l => 0 !== l).length === 0
        )
      }

      assert.fail("_update didn't throw")
    })
  })

  describe('containsId returns truthy', () => {
    it("throws an ajv-errors-to-data-tree tree with _id set to FieldUnknown with the returned value as data AND doesn't call any other dependencies", async () => {
      const updateCalls = []
      const idFieldName = '_id'
      try {
        await _update(
          '',
          { write: {}, remove: [] },
          {
            update: async () => {
              updateCalls.push(null)
            },
            validateObjectId: () => {
              return false
            },
            containsId: () => {
              return idFieldName
            },
          }
        )
      } catch (e) {
        return assert(
          // there's only _id property in e.node and it has a single error
          1 === Object.keys(e.tree.node).length &&
            1 === e.tree.node._id?.errors.length &&
            // the error is FieldUnknown with data being the value returned by containsId
            m.FieldUnknown.code === e.tree.node._id.errors[0].code &&
            // && idFieldName === e.node._id.errors[0].data

            // none of the other dependencies has been called
            [updateCalls.length].filter(l => 0 !== l).length === 0
        )
      }

      assert.fail("_update didn't throw")
    })
  })

  describe('validateObjectId and containsId return falsy', () => {
    it('update gets called AND the arguments are passed to it', async () => {
      const id = 'an id',
        _write = 'write',
        _remove = 'remove'
      let isEqual = null

      await _update(
        id,
        { write: _write, remove: _remove },
        {
          update: async (_id, { write, remove }) => {
            isEqual = id === _id && _write === write && _remove === remove
            return true
          },
          validateObjectId: () => {
            return false
          },
          containsId: data => {
            return false
          },
        }
      )

      assert.strictEqual(isEqual, true)
    })
  })

  describe('update throws a non-ValidationError error', () => {
    it("throws the error on AND doesn't call any other dependencies", async () => {
      const ERR_MSG = 'an error message'

      try {
        await _update(
          '',
          { write: {}, remove: [] },
          {
            update: async () => {
              throw new Error(ERR_MSG)
            },
            validateObjectId: () => {
              return false
            },
            containsId: () => {
              return false
            },
          }
        )
      } catch (e) {
        return assert.strictEqual(e.message, ERR_MSG)
      }

      assert.fail("_update didn't throw")
    })
  })

  describe('update throws a ValidationError', () => {
    it('throws a ValidationError message', async () => {
      try {
        const res = await _update(
          '',
          { write: {}, remove: [] },
          {
            update: async () => {
              throw new ValidationError()
            },
            validateObjectId: () => {
              return false
            },
            containsId: () => {
              return false
            },
          }
        )
      } catch (e) {
        return assert.strictEqual(e.code, m.ValidationError.code)
      }

      assert.fail("didn't throw")
    })
  })

  describe('update returns null', () => {
    it('throws InvalidCriterion', async () => {
      try {
        await _update(
          '',
          { write: {}, remove: [] },
          {
            update: async () => {
              return null
            },
            validateObjectId: () => {
              return false
            },
            containsId: () => {
              return false
            },
          }
        )
      } catch (e) {
        return assert(e.code, m.InvalidCriterion.code)
      }

      assert.fail("didn't throw")
    })
  })

  describe('update returns false', () => {
    it('returns true', async () => {
      const res = await _update(
        '',
        { write: {}, remove: [] },
        {
          update: async () => {
            return false
          },
          validateObjectId: () => {
            return false
          },
          containsId: () => {
            return false
          },
        }
      )

      return assert(res, true)
    })
  })

  describe('update returns true', () => {
    it('returns true', async () => {
      const res = await _update(
        '',
        { write: {}, remove: [] },
        {
          update: async () => {
            return true
          },
          validateObjectId: () => {
            return false
          },
          containsId: () => {
            return false
          },
        }
      )

      return assert(res, true)
    })
  })
}

export { testUpdate }
