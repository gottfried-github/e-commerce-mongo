import Auth from './auth/index.js'
import Product from './product/index.js'
import Photo from './photo/index.js'

function store(db, client) {
    // first, validate db (see 'BazarMongo: validating the passed database')

    const auth = Auth(db.collection('admins'))
    const product = Product({client, product: db.collection('product'), photos: db.collection('photo')})
    const photo = Photo(db.collection('photo'))

    return {auth, product, photo}
}

export default store
