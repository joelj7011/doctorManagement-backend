const mongoose = require('mongoose');
const { DB_NAME } = require('../../Constants');
const catchAsyncErrors = require('../Utils/CatchAsyncError.util');

exports.connectToMongo = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("\n Mongoose connected !! DB host: ", connectionInstance.connection.host)
    } catch (error) {
        catchAsyncErrors(error, req, res);
    }
}

