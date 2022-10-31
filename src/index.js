import Product from './product/index.js'

function store(db, client) {
    // first, validate db (see 'BazarMongo: validating the passed database')

    const product = Product(db.collection('product'))

    return {product}
}

export default store
