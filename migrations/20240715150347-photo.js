const schemaPrev = require('./20231230121331-photo.js').schema

const pathSchema = {
  bsonType: 'string',
  minLength: 1,
  maxLength: 1000,
}

const pathsPublicSchema = {
  bsonType: 'object',
  properties: {
    original: pathSchema,
  },
  required: ['original'],
  additionalProperties: pathSchema,
}

const schema = JSON.parse(JSON.stringify(schemaPrev))

delete schema.oneOf[0].pathPublic
delete schema.oneOf[1].pathPublic

schema.oneOf[0].required.splice(schema.oneOf[0].required.indexOf('pathPublic'), 1)
schema.oneOf[1].required.splice(schema.oneOf[1].required.indexOf('pathPublic'), 1)

schema.oneOf[0].properties.pathsPublic = pathsPublicSchema
schema.oneOf[1].properties.pathsPublic = pathsPublicSchema

schema.oneOf[0].required.push('pathsPublic')
schema.oneOf[1].required.push('pathsPublic')

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
