const schema = {
  bsonType: 'object',
  properties: {
    _id: { bsonType: 'objectId' },
    name: {
      bsonType: 'string',
      minLength: 8,
      maxLength: 150,
    },
    hash: { bsonType: 'binData' },
    salt: { bsonType: 'binData' },
  },
  required: ['_id', 'name', 'hash', 'salt'],
  additionalProperties: false,
}

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    db.createCollection('admins', {
      validator: { $jsonSchema: schema },
    })
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    return db.dropCollection('admins')
  },
  schema,
}
