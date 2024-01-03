import addPhotos from './product/addPhotos.js'
import removePhotos from './product/removePhotos.js'
import updatePhotosPublicity from './product/updatePhotosPublicity.js'
import setCoverPhoto from './product/setCoverPhoto.js'
import update from './product/update.js'

console.log('test/store/index.js')

describe('store', async () => {
    addPhotos()
    removePhotos()
    updatePhotosPublicity()
    setCoverPhoto()
    update()
})