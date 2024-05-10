import { MongoClient } from 'mongodb'

import Product from '../src/product/index.js'

if (
  !process.env.APP_DB_NAME ||
  !process.env.APP_DB_USER ||
  !process.env.APP_DB_PASS ||
  !process.env.NET_NAME
)
  throw new Error('all of the database connection parameters environment variables must be set')

const logs = []
function log(...args) {
  logs.push(...args)
  console.log(...args)
}

const client = new MongoClient(
  `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`
)
client.connect()

const db = client.db(process.env.APP_DB_NAME)
const c = db.collection('product')

const product = Product(c)

async function recurse(ids, recurse) {
  if (!ids.length) return []

  const doc = await product.getById(ids.shift())
  return [doc, ...(await recurse(ids, recurse))]
}

async function main() {
  const products = await product.getMany()

  const docs = await recurse(
    products.map(product => product.id),
    recurse
  )
  log(docs)
}

export { main, log, logs }
