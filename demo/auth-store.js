import {ObjectId} from 'bson'
import {MongoClient} from 'mongodb'
import {generateHash} from '../src/auth/helpers.js'

import {_storeCreate, _storeGetById, _storeGetByName} from '../src/auth/store.js'

/* connect to database */
if (!process.env.APP_DB_NAME || !process.env.APP_DB_USER || !process.env.APP_DB_PASS || !process.env.NET_NAME) throw new Error('all of the database connection parameters environment variables must be set')

const client = new MongoClient(`mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@${process.env.NET_NAME}/${process.env.APP_DB_NAME}`)
client.connect()

const db = client.db(process.env.APP_DB_NAME)
const c = db.collection('admins')

const logs = []
function log(...args) {
    logs.unshift(...args)
    console.log(...args)
}

async function main() {
    const name = "still_other_name"

    let id = null

    try {
        id = await _storeCreate({_id: new ObjectId(), name, ...generateHash('01234567')}, {c})
    } catch(e) {
        log("_storeCreate threw, e:", e);
        return false
    }

    log("_storeCreate id:", id);

    let docById = null
    
    try {
        docById = await _storeGetById(id, {c})
    } catch (e) {
        log("_storeGetById threw, e:", e)
        return false
    }

    log("got the saved doc by id, docById:", docById)

    let docByName = null

    try {
        docByName = await _storeGetByName(name, {c})
    } catch (e) {
        log("_storeGetById threw, e:", e)
        return false
    }

    log("got the saved doc by name, docByName:", docByName)
}

export {
    main,
    client, db, c,
    logs
}