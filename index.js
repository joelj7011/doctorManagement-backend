const { connectToMongo } = require('./src/Db/index.db');
const app = require('./src/App');
require('dotenv').config();

connectToMongo().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
    .catch((error) => {
        console.log("Mongo DB Connection Failed!!", error)
    })




