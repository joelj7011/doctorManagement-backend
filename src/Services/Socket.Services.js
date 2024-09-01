const socketIO = require('socket.io');
const { getLineNumber } = require('../Utils/ErrorAtLine');
let io;

module.exports = {
    in_it: (server) => {
        io = socketIO(server);
        if (!io) {
            throw Error(`could nto create the server at ${__filename}, error at line ${getLineNumber()} `);
        }
        return io;
    },
    get_Io: () => {
        if (!io) {
            throw Error(`could not retrive the io at ${__filename} is not available error at line ${getLineNumber()}`);
        }
        return io;
    }
};

