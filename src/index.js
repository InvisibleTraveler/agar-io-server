const http = require('http');
const { Server } = require('socket.io');
const { GameRoom } = require('./game-room');

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT']
    }
});

const port = 8080;

const game = new GameRoom();

io.on('connect', socket => {
    console.log('connect ' + socket.id);

    socket.on('save-name', name => {
        console.log('user name saved:', name);
        game.addPlayer(socket, name);
    })
});

server.listen(port, () => console.log('server listening on port ' + port));
