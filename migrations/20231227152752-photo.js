const migrationPrev = require('./20221204174005-photos.js')

const schema = {
  bsonType: 'object',
  properties: {
    _id: { bsonType: 'objectId' },
    pathPublic: {
      bsonType: 'string',
      minLength: 1,
      maxLength: 1000,
    },
    pathLocal: {
      bsonType: 'string',
      minLength: 1,
      maxLength: 1000,
    },
  },
  required: ['_id', 'pathPublic', 'pathLocal'],
  additionalProperties: false,
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
        $jsonSchema: migrationPrev.schema,
      },
    })
  },

  schema,
}
