const rest = {
  _id: { bsonType: 'objectId' },
  name: { bsonType: 'string', minLength: 3, maxLength: 150 },
  price: { bsonType: 'number', minimum: 0, maximum: 1000000 },
  is_in_stock: { bsonType: 'bool' },
  photos: {
    bsonType: 'array',
    maxItems: 150,
    minItems: 1,
    items: {
      bsonType: 'string',
      minLength: 1,
      maxLength: 1000,
    },
  },
  cover_photo: {
    bsonType: 'string',
    minLength: 1,
    maxLength: 1000,
  },
  description: { bsonType: 'string', minLength: 1, maxLength: 15000 },
}

const schema = {
  oneOf: [
    {
      bsonType: 'object',
      properties: {
        expose: { bsonType: 'bool', enum: [true] },
        ...rest,
      },
      required: [
        'expose',
        'name',
        'price',
        'is_in_stock',
        'photos',
        'cover_photo',
        'description',
        '_id',
      ],
      additionalProperties: false,
    },
    {
      bsonType: 'object',
      properties: {
        expose: { bsonType: 'bool', enum: [false] },
        ...rest,
      },
      required: ['expose', '_id'],
      additionalProperties: false,
    },
  ],
}

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    return db.createCollection('product', {
      validator: {
        $jsonSchema: schema,
      },
    })
  },
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});

    db.dropCollection('product')
  },
  schema,
}
