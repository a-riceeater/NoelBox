require("dotenv").config()
const express = require('express')
const http = require('http')
const path = require("path")
const favicon = require('serve-favicon');

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

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`http://localhost:${port}`);
})