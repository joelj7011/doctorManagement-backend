const { connectToMongo } = require('./src/Db/index.db');
const app = require('./src/App');
const { connect_to_redis } = require('./src/Db/Redis.cache.db');
require('dotenv').config();
const fs = require('fs');
const https = require('https');
const url = require("url");


const options = {
    key: fs.readFileSync('./certs/server-key.pem'),
    cert: fs.readFileSync('./certs/server-cert.pem')
}

connectToMongo().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
    .catch((error) => {
        console.log("Mongo DB Connection Failed!!", error)
    })

connect_to_redis();


const server = https.createServer(options, (req, res) => {
    const ipAddress = req.socket.remoteAddress;
    const log = `date->${new Date().toISOString()} url-> ${req.url} ip-> ${ipAddress} req received\n`;
    const myUrl = url.parse(req.url, true);

    console.log(myUrl);

    try {
        fs.mkdirSync('./data', { recursive: true });
    } catch (err) {
        console.error('Error creating directory:', err);
    }

    try {
        fs.writeFileSync('./data/userdata.txt', log, { flag: 'a' });
    } catch (err) {
        console.error('Error writing file:', err);
    }

    app(req, res);
});

server.listen(3000, () => {
    console.log('HTTPS server running on https://localhost:3000');
});




