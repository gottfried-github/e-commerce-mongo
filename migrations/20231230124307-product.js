const schemaPrev = require('./20230529183415-time.js').schema

const schema = {...schemaPrev}

const schemaExposeTrue = schema.oneOf[0]
const schemaExposeFalse = schema.oneOf[1]

delete schemaExposeTrue.photos
delete schemaExposeTrue.photos_all
delete schemaExposeTrue.cover_photo
schemaExposeTrue.required.splice(schemaExposeTrue.required.indexOf('photos'), 1)
schemaExposeTrue.required.splice(schemaExposeTrue.required.indexOf('photos_all'), 1)
schemaExposeTrue.required.splice(schemaExposeTrue.required.indexOf('cover_photo'), 1)

delete schemaExposeFalse.photos
delete schemaExposeFalse.photos_all
delete schemaExposeFalse.cover_photo

console.log('migration, product, schema.oneOf[0]:', schema.oneOf[0])

module.exports = {
  async up(db, client) {
    return db.command({
      collMod: "product",
      validator: {
        $jsonSchema: schema
      }
    })
  },
  async down(db, client) {
    return db.command({
      collMod: "product",
      validator: {
          $jsonSchema: schemaPrev
      }
    })
  }
};
