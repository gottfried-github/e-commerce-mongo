import {assert} from 'chai'

// const tests = {
//     isInSaleRequired, isInSaleType,
//     isInSaleRequiredNameType, isInSaleNameType,
//     nameTypeItemInitialRequired
// }

function testJSONErrors(tests) {
    tests.isInSaleRequired.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'required' error for isInSale", () => {
                const errors = t.o(...t.i)

                assert(
                    // tree.node only includes isInSale;
                    1 === Object.keys(errors.node).length && 'isInSale' in errors.node

                    // tree.node.isInSale only has one error;
                    // the error keyword is 'required'
                    && 1 === errors.node.isInSale.errors.length && 'required' === errors.node.isInSale.errors[0].data.keyword
                )
            })
        })
    })

    tests.isInSaleType.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'type' error for isInSale", () => {
                const errors = t.o(...t.i)

                assert(
                    // tree.node only includes isInSale;
                    1 === Object.keys(errors.node).length && 'isInSale' in errors.node

                    // tree.node.isInSale only has one error;
                    // the error keyword is 'type'
                    && 1 === errors.node.isInSale.errors.length && 'type' === errors.node.isInSale.errors[0].data.keyword
                )
            })
        })
    })

    tests.isInSaleRequiredNameType.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'required' error for isInSale and 'type' error for name", () => {
                const errors = t.o(...t.i)

                const keys = Object.keys(errors.node)

                assert(
                    // tree.node only includes the two fields
                    2 === keys.length && keys.includes('isInSale') && keys.includes('name')

                    // each of the fields have one proper error
                    && 1 === errors.node.isInSale.errors.length && 'required' === errors.node.isInSale.errors[0].data.keyword
                    && 1 === errors.node.name.errors.length && 'type' === errors.node.name.errors[0].data.keyword
                )
            })
        })
    })

    tests.isInSaleNameType.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'type' error for isInSale and 'type' error for name", () => {
                const errors = t.o(...t.i)

                const keys = Object.keys(errors.node)

                assert(
                    // tree.node only includes the two fields
                    2 === keys.length && keys.includes('isInSale') && keys.includes('name')

                    // each of the fields have one proper error
                    && 1 === errors.node.isInSale.errors.length && 'type' === errors.node.isInSale.errors[0].data.keyword
                    && 1 === errors.node.name.errors.length && 'type' === errors.node.name.errors[0].data.keyword
                )
            })
        })
    })

    tests.nameTypeItemInitialRequired.forEach(t => {
        describe(t.description || "", () => {
            it("contains ONLY a 'type' error for name and a 'required' error for itemInitial", () => {
                const errors = t.o(...t.i)

                const keys = Object.keys(errors.node)

                assert(
                    2 === keys.length && keys.includes('name') && keys.includes('itemInitial')

                    && 1 === errors.node.name.errors.length && 'type' === errors.node.name.errors[0].data.keyword
                    && 1 === errors.node.itemInitial.errors.length && 'required' === errors.node.itemInitial.errors[0].data.keyword
                )
            })
        })
    })
}

export {testJSONErrors}
