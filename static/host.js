const socket = io();
let userAmount = 0;
const gameId = document.querySelector("#gameCode > span").innerText;
let started = false;

socket.emit("join-room", {
    host: true,
    gameId: gameId
});

const dotsInterval = setInterval(() => {
    if (document.querySelector(".dots").innerText.length == 3) document.querySelector(".dots").innerText = "."
    else document.querySelector(".dots").innerText += "."
}, 800)

const userElements = new Map();

socket.on("user-join", (user, userId) => {
    console.log(user, userId)
    if (started) return


    const uE = document.createElement("div");
    uE.classList.add("player-box");
    uE.innerHTML = `
    <img src="/player.png" alt="Player" class="player-icon">
    <p>${user}</p>
    `

    uE.id = "p-i-aw-" + userId;

    document.getElementById("awaiting-players").appendChild(uE);
    userElements.set(userId, uE);

    const it = setInterval(() => {
        if (!userElements.get(userId)) return clearInterval(it);
        uE.style.top = (Math.floor(Math.random() * (90 - 5) + 5) + 5) + "%";
        uE.style.left = Math.floor(Math.random() * (95 - 5) + 5) + "%";
    }, 3000)

    document.getElementById("host-log").innerHTML = `${user} (${userId}) joined the game...`
    userAmount++;
    updateButtonDisabled();
})

socket.on("user-leave", (userName, userId) => {
    document.getElementById("p-i-aw-" + userId).remove();
    document.getElementById("host-log").innerHTML = `${userName} (${userId}) left the game...`
    userAmount--;
    updateButtonDisabled();
})

function updateButtonDisabled() {
    if (userAmount <= 0) {
        document.getElementById("start-game-btn").classList.add("disabled");
    } else {
        document.getElementById("start-game-btn").classList.remove("disabled");
    }
}

window.addEventListener("beforeunload", () => {
    //socket.emit("end-game", gameId);
});

document.getElementById("start-game-btn").addEventListener("click", (e) => {
    if (e.target.classList.contains("disabled")) return;
    socket.emit("start-game", gameId);
    e.target.classList.add("disabled");
})

let questionNumber = 1;

let tI, correctAnswer;

socket.on("new-question", (data) => {
    questionNumber++;

    document.getElementById("awaiting-players").innerHTML = `
    <div id="questions-screen">
        <div id="question-show-next">
            <h1>Question <span id="question-s-n-i">${data.number}</span></h1>
        </div>
    </div>
    `

    setTimeout(() => {
        let time = 15;

        document.getElementById("question-show-next").style.display = "none"
        document.getElementById("questions-screen").innerHTML = `
        <h1>${data.question}</h1>
        <p data="${data.options[0] == data.answer ? "correct" : ""}">A: ${data.options[0]}</p>
        <p data="${data.options[1] == data.answer ? "correct" : ""}">B: ${data.options[1]}</p>
        <p data="${data.options[2] == data.answer ? "correct" : ""}">C: ${data.options[2]}</p>
        <p data="${data.options[3] == data.answer ? "correct" : ""}">D: ${data.options[3]}</p>

        <p id="qs-timer">${time}s</p>
        <p id="qs-anser">0 Players Answered</p>
        `

        correctAnswer = data.answer;

        tI = setInterval(() => {
            time--;
            document.querySelector('#questions-screen > #qs-timer').innerText = time + "s";

            if (time == 0) {
                clearInterval(tI);
                socket.emit("answer-time-done", gameId)

                let i = 1;
                let f = false;
                document.querySelectorAll("#questions-screen > p").forEach(e => {
                    if (f) return

                    setTimeout(() => a(e), (i * 1000));
                    if (e.getAttribute("data") != "correct") i++;
                })

                function a(e) {
                    if (f) return

                    if (e.id) {
                        f = true;
                        setTimeout(() => {
                            document.querySelector("#questions-screen > #qs-timer").innerText = "0s";
                            document.querySelector("#questions-screen > p[data='correct']").classList.add("correct-a");

                            setTimeout(leaderBoard, 1500)
                        }, 100)
                        return
                    }

                    if (e.getAttribute("data") != "correct") e.style.textDecoration = "line-through";
                }
            }
        }, 1000)
    }, 1500)
})

function leaderBoard() {
    fetch("/api/fetch-user-stats/" + gameId, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((d) => d.json())
        .then((d) => {
            const users = d.users;
            console.dir(users);

            document.getElementById("questions-screen").innerHTML = `
            <h1>Leaderboard</h1>
            `

            for (let i = 0; i < users.length; i++) {
                const el = document.createElement("p");

                if (!users[i]) continue
                if (userAnswers[users[i].id] == correctAnswer) {
                    el.innerHTML = `${users[i].name}: ${parseInt(users[i].points) + 1} <span style="color: green">(+1)</span>`
                    socket.emit("update-user-points", {
                        points: parseInt(users[i].points) + 1,
                        gameId: gameId,
                        userId: users[i].id
                    })
                } else {
                    el.innerHTML = `${users[i].name}: ${users[i].points} <span style="color: red">(+0)</span>`
                }

                document.getElementById("questions-screen").appendChild(el);
            }

            setTimeout(() => {
                answered = 0;

                if ((questionNumber % 1) == 0) { // spin the wheel
                    document.getElementById("questions-screen").innerHTML = `
                    <h1>It has been 5 rounds! Time to spin the wheel.</h1>
                    `
                    fetch("/api/whospinwheel/" + gameId, {
                        method: "GET",
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then((d) => d.json())
                        .then((d) => {
                            setTimeout(() => {
                                console.log(d);
                                document.getElementById("questions-screen").innerHTML = `
                                <h1>${d.user.name} will be spinning the wheel, since they have ${d.points} points!</h1>
                                `

                                setTimeout(() => {
                                    document.getElementById("questions-screen").innerHTML = `
                                    <h1>${d.user.name}, on your screen, there will be a wheel to spin.</h1>
                                    <h1>There is a 1/3 chance that you may lose 3 points, or that you may win the game!</h1>
                                    `

                                    socket.emit("player-spin-wheel", {
                                        gameId: gameId,
                                        id: d.user.id
                                    })
                                }, 1500)
                            }, 1500)
                        })
                } else { // continuue with questions
                    socket.emit("display-question", {
                        number: questionNumber,
                        gameId: gameId
                    })
                }
            }, 2500)
        })
}

let answered = 0;
let userAnswers = {};

socket.on("host-player-answer-amt-change", (data) => {
    answered++;
    document.querySelector("#questions-screen > #qs-anser").innerText = `${answered} Players Answered`;
    document.querySelector("#questions-screen > #qs-timer").innerText = "";

    userAnswers[data.id] = data.answer;

    if (answered == userAmount) {
        clearInterval(tI);
        socket.emit("answer-time-done", gameId)
        document.querySelector("#questions-screen > #qs-anser").innerText = `All Players Answered`;

        let i = 1;
        let f = false;
        document.querySelectorAll("#questions-screen > p").forEach(e => {
            if (f) return

            setTimeout(() => a(e), (i * 1000));
            if (e.getAttribute("data") != "correct") i++;
        })

        function a(e) {
            if (f) return

            if (e.id) {
                f = true;
                setTimeout(() => {
                    document.querySelector("#questions-screen > p[data='correct']").classList.add("correct-a");

                    setTimeout(leaderBoard, 1500)
                }, 100)
                return
            }

            if (e.getAttribute("data") != "correct") e.style.textDecoration = "line-through";
        }
    }
})

socket.on("game-start", () => {
    clearInterval(dotsInterval);
    started = true;

    document.querySelector("#awaiting-players > #ap-title").innerText = "Game starting!"
    document.getElementById("gameCode").remove();

    socket.emit("display-question", {
        number: questionNumber,
        gameId: gameId
    })
    return


    setTimeout(() => {
        document.getElementById("awaiting-players").innerHTML = `
        <div id="game-instructions">
        <h1 style="animation: spin 2s ease-in-out">Welcome to NoelBox, a trivia game!</h1>
        </div>
        `

        setTimeout(() => {
            document.getElementById("game-instructions").innerHTML = `
            <p style="animation: fs 4s infinite ease-in-out">In NoelBox, you will compete against other players to answer trivia questions.</p>
            `

            setTimeout(() => {
                document.getElementById("game-instructions").innerHTML = `
                <p style="animation: fs 3s infinite ease-in-out">For each correct question you get, you will gain points.</p>
                `

                setTimeout(() => {
                    document.getElementById("game-instructions").innerHTML = `
                    <p style="animation: fs 4s infinite ease-in-out">After every 5 rounds, the player with the most points will spin a wheel.</p>
                    `

                    setTimeout(() => {
                        document.getElementById("game-instructions").innerHTML = `
                        <p style="animation: fs 4s infinite ease-in-out">The wheel will determine wether that player will win. However, there is a chance that the player may lose 3 of their points! If they win, the game is over!</p>
                        `

                        setTimeout(() => {
                            socket.emit("display-question", {
                                number: questionNumber,
                                gameId: gameId
                            })
                        }, 4000)
                    }, 4000)
                }, 4000)
            }, 4000)
        }, 3500)
    }, 3000)
})