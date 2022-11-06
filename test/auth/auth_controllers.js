import {assert} from 'chai'

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
    
    // describe('create cb returns', () => {
    //     it('returns the value, returned by create', async () => {
    //         const res = await _create({}, {
    //             generateHash: () => {},
    //             create: async () => {
    //                 return "some id"
    //             }
    //         })
    //     })
    // })
}

export {testCreate}