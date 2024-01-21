const socketIO = require('socket.io');

function initializeSocket(server) {
    const io = socketIO(server);


    io.on('connection', (socket) => {
        console.log('A user connected');

        // Add your socket event handlers here

        socket.on('disconnect', () => {
            console.log('A user disconnected')
        })
    })

    return io;
}

module.exports = initializeSocket