const schemaPrev = require('./20221107083905-admins-name.js').schema

const schema = JSON.parse(JSON.stringify(schemaPrev))
schema.properties.email = {
  bsonType: 'string',
  minLength: 3,
  maxLength: 150,
}
schema.required.push('email')

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    return db.command({
      collMod: 'admins',
      validator: {
        $jsonSchema: schema,
      },
    })
  },
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    return db.command({
      collMod: 'admins',
      validator: {
        $jsonSchema: schemaPrev,
      },
    })
  },
  schema,
}
