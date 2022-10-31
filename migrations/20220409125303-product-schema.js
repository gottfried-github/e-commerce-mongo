const productOtherProps = {
    name: {
        bsonType: "string"
    },
    itemInitial: {
        bsonType: "string"
    },
    _id: {bsonType: "objectId"}
}

const product = {
    oneOf: [
        {
            bsonType: "object",
            properties: {
                isInSale: {
                    bsonType: "bool",
                    enum: [true]
                },
                ...productOtherProps
            },
            required: ["isInSale", "name", "itemInitial", "_id"]
        },
        {
            bsonType: "object",
            properties: {
                _id: {bsonType: "objectId"},
                isInSale: {
                    bsonType: "bool",
                    enum: [false]
                },
                ...productOtherProps
            },
            required: ["isInSale", "_id"]
        }
    ]
}

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    return db.createCollection("product", {validator: {
        $jsonSchema: product
    }})
  },
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});

    db.dropCollection("product")
  },
  schemas: {product}
};
