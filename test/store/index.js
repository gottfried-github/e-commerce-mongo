import addPhotos from './product/addPhotos.js'
import removePhotos from './product/removePhotos.js'
import updatePhotosPublicity from './product/updatePhotosPublicity.js'
import setCoverPhoto from './product/setCoverPhoto.js'
import reorderPhotos from './product/reorderPhotos.js'
import update from './product/update.js'
import productDelete from './product/delete.js'

console.log('test/store/index.js')

describe('store', async () => {
  addPhotos()
  removePhotos()
  updatePhotosPublicity()
  setCoverPhoto()
  reorderPhotos()
  update()
  productDelete()
})
