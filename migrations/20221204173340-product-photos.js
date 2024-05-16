const schemaPrev = require('./20220409125303-product-schema.js').schema
const photosItem = { bsonType: 'objectId' }

const photos_all = {
  bsonType: 'array',
  minItems: 1,
  maxItems: 500,
  items: photosItem,
}

const schema = schemaPrev

schema.oneOf[0].properties.photos_all = photos_all
schema.oneOf[1].properties.photos_all = photos_all

schema.oneOf[0].properties.photos.items = photosItem
schema.oneOf[1].properties.photos.items = photosItem

schema.oneOf[0].properties.cover_photo = photosItem
schema.oneOf[1].properties.cover_photo = photosItem

module.exports = {
  async up(db, client) {
    return db.command({
      collMod: 'product',
      validator: {
        $jsonSchema: schema,
      },
    })
  },

  async down(db, client) {
    return db.command({
      collMod: 'product',
      validator: {
        $jsonSchema: schemaPrev,
      },
    })
  },

  schema,
}
