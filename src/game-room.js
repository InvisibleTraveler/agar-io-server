const { genRandom, dataProvider, calcDistance, calcNewRadius } = require('./helpers');
const { Locker } = require('./locker');

class GameRoom {
    playersLock = new Locker();
    players = [];
    foodLock = new Locker();
    food = [];
    roomSize = 1000;
    foodAppearDelay = 100;

    constructor(roomSize, foodAppearDelay) {
        this.roomSize = roomSize || 1000;
        this.foodAppearDelay = foodAppearDelay || 100;
        this.firstFoodGeneration();

        setInterval(() => {
            this.foodLock.enter();
            if (this.food.length < 1000) {
                this.food.push(this.genFood());
            }
            this.foodLock.leave();
            this.updateGameState();
        }, 1000);
    }

    firstFoodGeneration(foodNumber) {
        foodNumber = foodNumber || 1000;
        this.foodLock.enter();
        for (let i = 0; i < foodNumber; i++) {
            this.food.push(this.genFood());
        }
        this.foodLock.leave();

        this.updateGameState();
    }

    genFood() {
        return { x: genRandom(0, this.roomSize), y: genRandom(0, this.roomSize) };
    }

    addPlayer(socket, name) {
        const player = {
            socket,
            name,
            color: `#${genRandom(0, 255).toString(16)}${genRandom(0, 255).toString(16)}${genRandom(0, 255).toString(16)}`,
            x: genRandom(100, this.roomSize - 100),
            y: genRandom(100, this.roomSize - 100),
            r: 2
        };

        this.playersLock.enter();
        this.players.push(player);
        this.playersLock.leave();

        this.handlePlayerEvents(player);

        this.updateGameState();
    }

    handlePlayerEvents(player) {
        const socket = player.socket;

        socket.on('move', dataProvider(this.handleMove.bind(this), player));
        socket.on('disconnect', dataProvider(this.handleDisconnect.bind(this), socket.id));
    }

    handleMove(player, moveDirection) {
        this.playersLock.enter();

        player.y += moveDirection.y;
        player.y =
            player.y + player.r > this.roomSize
                ? this.roomSize - player.r
                : player.y - player.r < 0
                    ? player.r
                    : player.y;
        player.x += moveDirection.x;
        player.x =
            player.x + player.r > this.roomSize
                ? this.roomSize - player.r
                : player.x - player.r < 0
                    ? player.r
                    : player.x;

        this.foodLock.enter();
        const newFood = this.food.filter(f => calcDistance(f, player) > player.r + 0.5);
        const eatenObjects = new Array(this.food.length - newFood.length).fill(1);
        this.food = newFood;
        this.foodLock.leave();

        const farPlayers = [];
        let touchedPlayers = [];

        this.players.forEach(p => {
            const arr = calcDistance(p, player) > player.r + p.r ? farPlayers : touchedPlayers;
            arr.push(p);
        });

        touchedPlayers = touchedPlayers.filter(p => p.socket.id !== player.socket.id);

        for (let i = 0; i < touchedPlayers.length; i++) {
            const enemyPlayer = touchedPlayers[i];
            if (player.r > enemyPlayer.r) {
                eatenObjects.push(enemyPlayer.r);
            } else {
                enemyPlayer.r = calcNewRadius(enemyPlayer.r, player.r);
                this.players = this.players.filter(p => p.socket.id !== player.socket.id);
                player.socket.emit('game-over', { killerName: enemyPlayer.name });
                this.playersLock.leave();
                this.updateGameState();
                return;
            }
        }

        this.players = farPlayers;

        touchedPlayers.forEach(p => p.socket.emit('game-over', { killerName: player.socket.name }));

        player.r = eatenObjects.reduce((sum, nextR) => calcNewRadius(sum, nextR), player.r);
        this.players.push(player);
        this.playersLock.leave();

        this.updateGameState();
    }

    handleDisconnect(playerId) {
        this.playersLock.enter();
        this.players = this.players.filter(p => p.socket.id !== playerId);
        this.playersLock.leave();

        this.updateGameState();
    }

    updateGameState() {
        this.playersLock.enter();
        const state = {
            players: this.players.map(p => ({ id: p.socket.id, name: p.name, color: p.color, x: p.x, y: p.y, r: p.r })),
            food: this.food,
            roomSize: this.roomSize
        };

        this.players.forEach(p => p.socket.emit('game-update', state));
        this.playersLock.leave();
    }
}

module.exports = { GameRoom };
