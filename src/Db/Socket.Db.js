const { createServer } = require('http');
const app = require('../App');
const { asyncHandler } = require('../Utils/AsyncHandler.Utiles');
const socket = require('../Services/Socket.Services');
const server = createServer(app);
exports.server = server;
exports.socket_io = asyncHandler(async () => {
    const io = socket.in_it(server, {
        cors: {
            origin: '*',
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('chat', (payload) => {
            console.log('what is paylaod', payload);
            io.emit("chat", payload);
        })
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
});

