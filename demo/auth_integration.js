import {MongoClient} from 'mongodb'

import Auth from '../src/auth/index.js'

/* connect to database */
if (!process.env.APP_DB_NAME || !process.env.APP_DB_USER || !process.env.APP_DB_PASS || !process.env.NET_NAME) throw new Error('all of the database connection parameters environment variables must be set')

const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
client.connect()

const db = client.db(process.env.APP_DB_NAME)
const c = db.collection('admins')

const auth = Auth(c)

const logs = []
function log(...args) {
    logs.unshift(...args)
    console.log(...args)
}

async function main() {
    const name = "my_even-other_name", password = "01234567"
    const id = await auth.create({name, password})

    log("created doc, id:", id)

    const docByName = await auth.getByName(name, password)

    log("found by name, doc:", docByName)

    const docById = await auth.getById(id)

    log("found by id, doc:", docById)
}

export {main, logs}