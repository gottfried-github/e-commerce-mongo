import { assert } from 'chai'
import * as m from '../../../e-commerce-common/messages.js'

import { _create } from '../../src/product/controllers.js'
import { ValidationConflict } from '../../src/helpers.js'
import { ValidationError } from '../../src/helpers.js'

function testCreate() {
  describe('create throws a non-ValidationError error', () => {
    it('throws the error on', async () => {
      const ERR_MSG = 'an error message'

      try {
        await _create(
          {},
          {
            create: async () => {
              throw new Error(ERR_MSG)
            },
          }
        )
      } catch (e) {
        return assert(
          // error is the one, thrown by update
          ERR_MSG === e.message
        )
      }

      assert.fail("_create didn't throw")
    })
  })

  describe('create throws a ValidationError', () => {
    it('throws a ValidationError message', async () => {
      try {
        const res = await _create('fields', {
          create: async () => {
            throw new ValidationError()
          },
        })
      } catch (e) {
        return assert.strictEqual(e.code, m.ValidationError.code)
      }

      assert.fail("didn't throw")
    })
  })

  describe('create returns a value', () => {
    it('returns the returned value', async () => {
      const id = 'an id'

      const res = await _create(
        {},
        {
          create: async () => {
            return id
          },
        }
      )

      return assert.strictEqual(res, id)
    })
  })
}

export { testCreate }
