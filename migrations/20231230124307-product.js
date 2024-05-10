const schemaPrev = require('./20230529183415-time.js').schema

const schema = { ...schemaPrev }

delete schema.oneOf[0].properties.photos
delete schema.oneOf[0].properties.photos_all
delete schema.oneOf[0].properties.cover_photo
schema.oneOf[0].required.splice(schema.oneOf[0].required.indexOf('photos'), 1)
schema.oneOf[0].required.splice(schema.oneOf[0].required.indexOf('photos_all'), 1)
schema.oneOf[0].required.splice(schema.oneOf[0].required.indexOf('cover_photo'), 1)

delete schema.oneOf[1].properties.photos
delete schema.oneOf[1].properties.photos_all
delete schema.oneOf[1].properties.cover_photo

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
}
