const socket = io();
const userName = document.querySelector("#pas > .pn").innerText;
const gameId = document.querySelector("#pas > .gi").innerText;

socket.emit("join-room", {
    userName: userName,
    gameId: gameId
});

socket.on("invalid-name", () => {
    alert("This name already exists in this game.")
    window.location = "/"
})

socket.on("game-end", () => {
    document.querySelectorAll(".gs").forEach(e => e.style.display = "none")
    document.getElementById("waiting-start").style.display = "block";
    document.getElementById("waiting-start").innerHTML = `
    <h1>Game Ended</h1>
    <p>The game was ended by the host.</p>
    <img src="/player-sad.png" alt="PlayerIcon" height="128px" width="128px">
    `
})

socket.on("game-start", () => {
    document.getElementById("waiting-start").innerHTML = `
    <h1>Game Starting...</h1>
    <p>Get ready to play! Look up at the host screen.</p>
    <img src="/player.png" alt="PlayerIcon" height="128px" width="128px">
    `
})

let submitted = false;
socket.on("player-new-question", (data) => {
    if (data.number == 1) {
        document.querySelectorAll(".gs").forEach(e => e.style.display = "none");
        document.getElementById("question").style.display = "block"
    }

    let selected;

    document.getElementById("question").innerHTML = `
    <h1 id="questionNum">Question #null</h1>
    `
    document.querySelector("#question > #questionNum").innerText = `Question #${data.number}`
    document.getElementById("question").innerHTML += `
    <p class="q-sel-o">A: ${data.options[0]}</p>
    <p class="q-sel-o">B: ${data.options[1]}</p>
    <p class="q-sel-o">C: ${data.options[2]}</p>
    <p class="q-sel-o">D: ${data.options[3]}</p>

    <button id="q-sub-btn">Submit</button>
    `

    setTimeout(() => {
        document.querySelectorAll(".q-sel-o").forEach(b => {
            b.addEventListener("click", (e) => {
                if (submitted) return

                document.querySelectorAll(".q-sel-s").forEach(a => a.classList.remove("q-sel-s"));
                e.target.classList.add("q-sel-s");
                selected = e.target;
            })
        })

        document.getElementById("q-sub-btn").addEventListener("click", (e) => {
            if (submitted || !selected) return

            submitted = true;
            e.target.style.scale = 0;
            socket.emit("player-submit-question", {
                gameId: gameId,
                answer: selected.innerText.slice(3, selected.innerText.length)
            })
        })
    })
})

socket.on("player-no-time", () => {
    if (submitted) {
        document.getElementById("question").innerHTML = `
        <h1>Times up!</h1>
        <p>Look up to see the answer...</p>
        `
    } else {
        document.getElementById("question").innerHTML = `
        <h1>Times up!</h1>
        <p>You ran out of time.</p>
        `
    }

    submitted = false;
})

window.addEventListener("beforeunload", () => {
    socket.emit("leave-game", {
        gameId: gameId,
        userName: userName
    })
})

socket.on("spin-wheel", () => {
    document.getElementById("question").innerHTML = `
    <div class="spin-select-o">
    </div>
    <button>Ready?!</button>
    `

    setTimeout(() => {
        document.querySelector("#question > button").addEventListener("click", () => {
            const alphabet = "abcdefghijklmnopqrstuvwxyz"
            const ele = document.querySelector("#question > .spin-select-o")
            const options = ["You win!", "You lose!"];
            const it = ele.innerText;

            const result = options[Math.floor(Math.random() * options.length)];
            console.log(result);

            let i = 0;
            let b = 0;

            function iterateLoop() {
                if (i < 15) {
                    if (b < result.length) {
                        ele.innerText += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                        b++;
                    } else {
                        ele.innerText = result;
                        b = 0;
                        i++;
                    }

                    // Adjust the delay (in milliseconds) to control the timing
                    setTimeout(iterateLoop, 100); // Delay of 100 milliseconds
                }
            }

            iterateLoop();
        })
    })
})

function spin() {
    const sections = 5; // Number of sections in the spinner wheel
    const degreesPerSection = 360 / sections;
    const randomRotation = Math.floor(Math.random() * sections) * degreesPerSection;

    const spinner = document.getElementById('spinner');
    const arrow = document.getElementById('arrow');

    spinner.style.transform = `rotate(${(randomRotation * 2) + 180}deg)`;

    // Calculate the selected section index
    const selectedSectionIndex = sections - Math.floor((randomRotation + degreesPerSection / 2) % 360 / degreesPerSection);

    // Get all section elements and highlight the selected section
    const sectionElements = document.getElementsByClassName('section');
    for (let i = 0; i < sectionElements.length; i++) {
        if (i === selectedSectionIndex) {
            setTimeout(() => {
                sectionElements[i].classList.add('selected');
                console.log(sectionElements[i])
            }, 3000)
        } else {
            sectionElements[i].classList.remove('selected');
        }
    }
}
