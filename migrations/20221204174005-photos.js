const schema = {
  bsonType: 'object',
  properties: {
    _id: { bsonType: 'objectId' },
    path: {
      bsonType: 'string',
      minLength: 1,
      maxLength: 1000,
    },
  },
  required: ['_id', 'path'],
  additionalProperties: false,
}

module.exports = {
  async up(db, client) {
    return db.createCollection('photo', {
      validator: {
        $jsonSchema: schema,
      },
    })
  },
  async down(db, client) {
    db.dropCollection('photo')
  },

  schema,
}
