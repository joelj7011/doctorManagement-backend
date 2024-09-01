
const { connectToMongo } = require('./src/Db/index.db');
const { connect_to_redis } = require('./src/Db/Redis.cache.db');
const {server, socket_io} = require('../backend/src/Db/Socket.Db');
require('dotenv').config();


connectToMongo().then((res) => {
    server.listen(process.env.PORT, () => {
        return console.log(`Server is running on port ${process.env.PORT}`)
    });
    // socket_io();
    connect_to_redis(res);
}).catch((error) => {
    console.log("Mongo DB Connection Failed!!", error)
})





