import {_storeCreateMany} from './store.js'
import {_createMany} from './controllers.js'
import {_validate} from './validate.js'

function main(c) {
    function storeCreateMany(fields) {
        return _storeCreateMany(fields, {c})
    }

    return {
        createMany: (fields) => _createMany(fields, {
            createMany: storeCreateMany, 
            validate: _validate
        })
    }
}

export default main
