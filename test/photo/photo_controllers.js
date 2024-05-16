import { assert } from 'chai'

import * as m from '../../../e-commerce-common/messages.js'
import { ValidationError, ValidationConflict } from '../../src/helpers.js'

import { _createMany } from '../../src/photo/controllers.js'

function testCreateMany() {
  describe('passed data', () => {
    it('calls createMany with the data', async () => {
      const data = [{ path: 'some/path' }]
      let _data = null

      await _createMany(data, {
        createMany: async v => (_data = v),
      })

      assert.deepEqual(data, _data)
    })
  })

  describe('createMany throws', () => {
    it('throws the thrown error', async () => {
      const e = new Error('some message')

      try {
        await _createMany([{ path: 'some/path' }], {
          createMany: async () => {
            throw e
          },
        })
      } catch (_e) {
        return assert.strictEqual(_e.message, e.message)
      }

      assert.fail("didn't throw")
    })
  })

  describe('createMany throws ValidationError', () => {
    it('throws ValidationError message', async () => {
      try {
        await _createMany([{ path: 'some/path' }], {
          createMany: async () => {
            throw new ValidationError()
          },
        })
      } catch (_e) {
        return assert.strictEqual(_e.code, m.ValidationError.code)
      }

      assert.fail("didn't throw")
    })
  })

  describe('createMany returns', () => {
    it('returns the returned value', async () => {
      const res = await _createMany([{ path: 'some/path' }], {
        createMany: () => true,
        validate: () => null,
      })

      assert.isTrue(res)
    })
  })
}

export { testCreateMany }
