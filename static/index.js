document.querySelectorAll(".cc-btn").forEach(e => {
    e.addEventListener("click", (e) => {
        document.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"));
        e.target.classList.add("selected");
        document.querySelectorAll(".selected-screen").forEach(e => e.classList.remove("selected-screen"));
        document.getElementById("screen-" + e.target.innerText).classList.add("selected-screen")
    })
})

document.getElementById("jg-btn").addEventListener("click", (e) => {
    const gameCode = document.getElementById("gc-jg").value.trim().toUpperCase();
    const user = document.getElementById("nm-jg").value.trim().toUpperCase();

    if (!gameCode || !user) return e.target.innerText = "ALL INPUTS REQUIRED";
    if (e.target.innerText == "JOINING GAME...") return

    e.target.innerText = "JOINING GAME..."

    fetch("/api/validate-game-code/" + gameCode)
        .then((d) => d.text())
        .then((d) => {
            if (d == "true") {
                window.location = `/play/${gameCode}/${user}`;
            } else e.target.innerText = "FAILED. INVALID GAME CODE"
        })
        .catch((err) => {
            console.error(err);
            e.target.innerText = "FAILED. TRY AGAIN"
        })
})

document.getElementById("cg-btn").addEventListener("click", (e) => {
    if (document.getElementById("rn-cg").value.trim() == "") return e.target.innerText = "ALL INPUTS REQUIRED"
    if (e.target.innerText == "CREATING GAME...") return

    e.target.innerText = "CREATING GAME..."

    fetch("/api/create-game", {
        method: "POST",
        body: JSON.stringify({
            name: document.getElementById("rn-cg").value.trim()
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then((d) => d.json())
        .then((d) => {
            if (d.made) {
                window.location = `/host/${d.gameId}`
            } else e.target.innerText = "FAILED. TRY AGAIN"
        })
        .catch((err) => {
            console.error(err);
            e.target.innerText = "FAILED. TRY AGAIN"
        })
})