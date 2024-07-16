const schemaPrev = require('./20240715150347-photo.js').schema

const pathSchema = {
  bsonType: 'string',
  minLength: 1,
  maxLength: 1000,
}

const pathsLocalSchema = {
  bsonType: 'object',
  properties: {
    original: pathSchema,
  },
  required: ['original'],
  additionalProperties: pathSchema,
}

const schema = JSON.parse(JSON.stringify(schemaPrev))

delete schema.oneOf[0].pathLocal
delete schema.oneOf[1].pathLocal

schema.oneOf[0].required.splice(schema.oneOf[0].required.indexOf('pathLocal'), 1)
schema.oneOf[1].required.splice(schema.oneOf[1].required.indexOf('pathLocal'), 1)

schema.oneOf[0].properties.pathsLocal = pathsLocalSchema
schema.oneOf[1].properties.pathsLocal = pathsLocalSchema

schema.oneOf[0].required.push('pathsLocal')
schema.oneOf[1].required.push('pathsLocal')

module.exports = {
  async up(db, client) {
    return db.command({
      collMod: 'photo',
      validator: {
        $jsonSchema: schema,
      },
    })
  },
  async down(db, client) {
    return db.command({
      collMod: 'photo',
      validator: {
        $jsonSchema: schemaPrev,
      },
    })
  },

  schema,
}
