const schemaPrev = require('./20221204173340-product-photos.js').schema

const rest = {
  _id: { bsonType: 'objectId' },
  name: { bsonType: 'string', minLength: 3, maxLength: 150 },
  price: { bsonType: 'number', minimum: 0, maximum: 10e13 }, // max one trillion hryvnias
  is_in_stock: { bsonType: 'bool' },
  time: { bsonType: 'date' },
  description: { bsonType: 'string', minLength: 1, maxLength: 15000 },
  photos: {
    bsonType: 'array',
    minItems: 1,
    maxItems: 500,
    items: {
      bsonType: 'objectId',
    },
  },
  photos_all: {
    bsonType: 'array',
    minItems: 1,
    maxItems: 500,
    items: {
      bsonType: 'objectId',
    },
  },
  cover_photo: {
    bsonType: 'objectId',
  },
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
        'time',
        'description',
        'photos',
        'photos_all',
        'cover_photo',
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

  schema,
}
