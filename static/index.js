document.querySelectorAll(".cc-btn").forEach(e => {
    e.addEventListener("click", (e) => {
        document.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"));
        e.target.classList.add("selected");
        document.querySelectorAll(".selected-screen").forEach(e => e.classList.remove("selected-screen"));
        document.getElementById("screen-" + e.target.innerText).classList.add("selected-screen")
    })
})