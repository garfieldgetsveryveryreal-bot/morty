const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const players = {};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    players[socket.id] = {
        id: socket.id,
        x: 100,
        y: 600,
        vx: 0,
        vy: 0,
        facing: 'right',
        anim: 'mortyidle.gif',
        name: `Morty ${Math.floor(100 + Math.random() * 900)}`,
        bubbleText: '',
        customSkin: null
    };

    socket.emit('currentPlayers', players);

    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].vx = movementData.vx;
            players[socket.id].vy = movementData.vy;
            players[socket.id].facing = movementData.facing;
            players[socket.id].anim = movementData.anim;

            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('chatMessage', (data) => {
        if (players[socket.id]) {
            players[socket.id].bubbleText = data.text;
            
            if (data.text.startsWith('/name ')) {
                const newName = data.text.substring(6).trim();
                if (newName) {
                    players[socket.id].name = newName;
                }
            } else if (data.text.startsWith('/skin ')) {
                const skinUrl = data.text.substring(6).trim();
                if (skinUrl) {
                    players[socket.id].customSkin = skinUrl;
                }
            }

            io.emit('chatMessage', {
                id: socket.id,
                name: players[socket.id].name,
                text: data.text,
                customSkin: players[socket.id].customSkin
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Multiplayer game server running on port ${PORT}`);
});