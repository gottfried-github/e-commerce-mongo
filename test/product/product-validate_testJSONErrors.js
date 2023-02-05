import {assert} from 'chai'

// const tests = {
//     exposeRequired, exposeType,
//     exposeRequiredNameType, exposeNameType,
//     nameTypeItemInitialRequired
// }

function testJSONErrors(tests) {
    tests.exposeRequired.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'required' error for expose", () => {
                const errors = t.o(...t.i)

                assert(
                    // tree.node only includes expose;
                    1 === Object.keys(errors.node).length && 'expose' in errors.node

                    // tree.node.expose only has one error;
                    // the error keyword is 'required'
                    && 1 === errors.node.expose.errors.length && 'required' === errors.node.expose.errors[0].data.keyword
                )
            })
        })
    })

    tests.exposeType.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'type' error for expose", () => {
                const errors = t.o(...t.i)

                assert(
                    // tree.node only includes expose;
                    1 === Object.keys(errors.node).length && 'expose' in errors.node

                    // tree.node.expose only has one error;
                    // the error keyword is 'type'
                    && 1 === errors.node.expose.errors.length && 'type' === errors.node.expose.errors[0].data.keyword
                )
            })
        })
    })

    tests.exposeRequiredNameType.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'required' error for expose and 'type' error for name", () => {
                const errors = t.o(...t.i)

                const keys = Object.keys(errors.node)

                assert(
                    // tree.node only includes the two fields
                    2 === keys.length && keys.includes('expose') && keys.includes('name')

                    // each of the fields have one proper error
                    && 1 === errors.node.expose.errors.length && 'required' === errors.node.expose.errors[0].data.keyword
                    && 1 === errors.node.name.errors.length && 'type' === errors.node.name.errors[0].data.keyword
                )
            })
        })
    })

    tests.exposeNameType.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'type' error for expose and 'type' error for name", () => {
                const errors = t.o(...t.i)

                const keys = Object.keys(errors.node)

                assert(
                    // tree.node only includes the two fields
                    2 === keys.length && keys.includes('expose') && keys.includes('name')

                    // each of the fields have one proper error
                    && 1 === errors.node.expose.errors.length && 'type' === errors.node.expose.errors[0].data.keyword
                    && 1 === errors.node.name.errors.length && 'type' === errors.node.name.errors[0].data.keyword
                )
            })
        })
    })

    tests.nameTypePriceRequired.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'type' error for name and a 'required' error for price", () => {
                const errors = t.o(...t.i)

                const keys = Object.keys(errors.node)

                assert(
                    2 === keys.length && keys.includes('name') && keys.includes('price')

                    && 1 === errors.node.name.errors.length && 'type' === errors.node.name.errors[0].data.keyword
                    && 1 === errors.node.price.errors.length && 'required' === errors.node.price.errors[0].data.keyword
                )
            })
        })
    })
}

export {testJSONErrors}
