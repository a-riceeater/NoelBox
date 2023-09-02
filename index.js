require("dotenv").config()
const express = require('express')
const http = require('http')
const path = require("path")
const favicon = require('serve-favicon');
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = require("socket.io")(server, { 'force new connection': true });

app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "html/index.html"));
})

app.get("/administrator", (req, res) => {

})

const games = {};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
const createGameId = () => {
    let r = '';
    for (let i = 0; i < 6; i++) {
        r += alphabet.charAt(Math.floor(Math.random() * (alphabet.length - 0) + 0));
    }
    return r.toUpperCase();
}

app.post("/api/create-game", (req, res) => {
    if (!req.body.name) return res.send({ made: false })
    if (req.body.name.trim() == "") return res.send({ made: false })

    const gameId = createGameId();
    
    games[gameId] = {
        gameId: gameId,
        name: req.body.name,
        users: []
    };

    res.send({
        made: true,
        gameId: gameId
    });
})

app.get("/host/:gameId", (req, res) => {
    if (!games[req.params.gameId]) return res.send("This game does not exist. It may have been ended by the host.");

    let data = fs.readFileSync(path.join(__dirname, "html/host.html"), "utf8");
    data = data.replaceAll("{{ gameId }}", req.params.gameId);
    data = data.replaceAll("{{ name }}", games[req.params.gameId]);

    res.send(data);
})

app.get("/play/:gameId/:userName", (req, res) => {
    if (!games[req.params.gameId]) return res.send("This game does not exist. It may have been ended by the host.");

    let data = fs.readFileSync(path.join(__dirname, "html/player.html"), "utf8");
    data = data.replaceAll("{{ gameId }}", req.params.gameId);
    data = data.replaceAll("{{ roomName }}", games[req.params.gameId].name);
    data = data.replaceAll("{{ userName }}", req.params.userName);

    res.send(data);
})

app.get("/api/validate-game-code/:gameId", (req, res) => {
    res.send(!!games[req.params.gameId]); // sends boolean if the game exists or not
})

app.get("/api/fetch-user-stats/:gameId", (req, res) => {
    res.send({
        users: games[req.params.gameId].users
    })
})

app.get("/api/whospinwheel/:gameId", (req, res) => {
    let highest = -1;
    let highestUser;

    for (let i = 0; i < games[req.params.gameId].users.length; i++) {
        if (games[req.params.gameId].users[i] && games[req.params.gameId].users[i].points > highest) { 
            highest = games[req.params.gameId].users[i].points 
            highestUser = games[req.params.gameId].users[i]
        }
    }

    res.send({
        points: highest,
        user: highestUser
    })
})

app.get("*", (req, res) => {
    res.send("404: Page not found.")
})

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, "trivia.json"), "utf8")).questions;

io.on("connection", (socket) => {
    app.set("socket", socket);

    socket.on("join-room", (data) => {
        if (games[data.gameId].users[data.userName]) return socket.emit("invalid-name");

        if (!data.host) io.to(data.gameId).emit("user-join", data.userName, socket.id);
        
        socket.join(data.gameId);
        if (!data.host) games[data.gameId].users.push({
            id: socket.id,
            points: 0,
            won: false,
            name: data.userName
        })
    })

    socket.on("leave-game", (data) => {
        io.to(data.gameId).emit("user-leave", data.userName, socket.id);

        if (!games[data.gameId] || !games[data.gameId].users) return
        for (let i = 0; i < games[data.gameId].users.length; i++) {
            if (!games[data.gameId].users[i]) continue

            if (games[data.gameId].users[i].id == socket.id) {
                games[data.gameId].users[i] = null
            }
        }
    })

    socket.on("end-game", (gameId) => {
        delete games[gameId];
        io.to(gameId).emit("game-end");
    })

    socket.on("start-game", (gameId) => {
        io.to(gameId).emit("game-start");
    })

    socket.on("display-question", (data) => {
        const question = questions[Math.floor(Math.random() * (questions.length - 0) + 0)]
        
        socket.emit("new-question", {
            number: data.number,
            question: question.q,
            options: question.o,
            answer: question.a
        });

        io.to(data.gameId).emit("player-new-question", {
            number: data.number,
            options: question.o
        })
    })

    socket.on("player-submit-question", (data) => {
        io.to(data.gameId).emit("host-player-answer-amt-change", {
            id: socket.id,
            answer: data.answer
        });
    })

    socket.on("answer-time-done", (gameId) => {
        io.to(gameId).emit("player-no-time");
    })

    socket.on("update-user-points", (data) => {
        console.log(data.userId)
        for (let i = 0; i < games[data.gameId].users.length; i++) {
            if (games[data.gameId].users[i] && games[data.gameId].users[i].id == data.userId) {
                console.log(games[data.gameId].users[i])
                games[data.gameId].users[i].points = data.points
            }
        }
    })

    socket.on("player-spin-wheel", (data) => {
        console.log(data.id)
        io.to(data.id).emit("spin-wheel");
    })
})

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`http://localhost:${port}`);
})