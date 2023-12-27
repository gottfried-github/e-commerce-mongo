mongosh "mongodb://$ADMIN_USER:$ADMIN_PSSWD@$NET_NAME" << EOF

// initiate the replica set (https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/)
rs.initiate()

// creates the app user with the following roles: `readWrite`; `dbAdmin` - to be able to perform `collMod` on collections
use app
db.createUser({user: "$APP_USER", pwd: "$APP_PSSWD", roles: [{role: "readWrite", db: "$DB_NAME"}, {role: "dbAdmin", db: "$DB_NAME"}]})

quit()
EOF