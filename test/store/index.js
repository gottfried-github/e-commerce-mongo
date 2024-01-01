import addPhotos from './product/addPhotos.js'
import removePhotos from './product/removePhotos.js'
import update from './product/update.js'

console.log('test/store/index.js')

describe('store', async () => {
    addPhotos()
    removePhotos()
    update()
})