import {assert} from 'chai'
import {ValidationError, ValueNotUnique} from '../../src/helpers.js'

import {_create} from '../../src/auth/controllers.js'

function testCreate() {
    describe('called', () => {
        it('create cb is called with data returned by generateHash', async () => {
            const data = 'some data'
            let isEqual = false

            await _create({password: 'some pswd'}, {
                generateHash: () => {
                    return {someProp: data}
                },
                create: async (_data) => {
                    isEqual = data === _data.someProp
                }
            })

            assert.strictEqual(isEqual, true)
        })
    })
    
    describe("'create' cb returns", () => {
        it("returns the value, returned by 'create' cb", async () => {
            const data = "some data"
            const res = await _create({}, {
                generateHash: () => {},
                create: async () => {
                    return data
                }
            })

            assert.strictEqual(res, data)
        })
    })

    describe("'create' cb throws ValidationError", () => {
        it('calls validate', async () => {
            let isCalled = false
            
            try {
                await _create({}, {
                    create: async () => {throw new ValidationError("some message")},
                    validate: () => {isCalled = true; return "some errors"},
                    generateHash: () => {}
                })
            } catch (e) {}

            assert.strictEqual(isCalled, true)
        })
    })
}

export {testCreate}