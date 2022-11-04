import {ObjectId} from 'bson'
import {MongoClient} from 'mongodb'
import {generateHash} from '../src/auth/helpers.js'

import {_storeCreate, _storeGetById} from '../src/auth/store.js'

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
    let id = null

    try {
        id = await _storeCreate({_id: new ObjectId(), name: "other_name", ...generateHash('01234567')}, {c})
    } catch(e) {
        log("_storeCreate threw, e:", e);
        return false
    }

    log("_storeCreate id:", id);

    let doc = null
    
    try {
        doc = await _storeGetById(id, {c})
    } catch (e) {
        log("_storeGetById threw, e:", e)
        return false
    }

    log("got the saved doc by id, doc:", doc)
}

export {
    main,
    client, db, c,
    logs
}