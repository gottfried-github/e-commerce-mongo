const schemaPrev = require('./20231227152752-photo.js').schema

const schemaBase = { ...schemaPrev }

schemaBase.properties.productId = { bsonType: 'objectId' }
schemaBase.properties.cover = { bsonType: 'bool' }
schemaBase.required.push('productId', 'cover', 'public')

const schemaNotPublic = JSON.parse(JSON.stringify(schemaBase))
schemaNotPublic.properties.public = {
  bsonType: 'bool',
  enum: [false],
}

const schemaPublic = JSON.parse(JSON.stringify(schemaBase))
schemaPublic.properties.public = {
  bsonType: 'bool',
  enum: [true],
}
schemaPublic.properties.order = { bsonType: 'int' }
schemaPublic.required.push('order')

const schema = {
  oneOf: [schemaNotPublic, schemaPublic],
}

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
