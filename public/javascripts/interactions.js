function GameState(socket) {
    this.socket = socket;
    this.guess = [];
    this.playerType = null; // A or B
    this.myTurn = false;
}

GameState.prototype.setStatus = function (statusText) {
    document.querySelector(".status").innerHTML = "Status: " + statusText;
};

GameState.prototype.updateScore = function (player) {
    let score = null;

    if (player === this.playerType) {
        score = document.querySelectorAll(".myScore");
    } else {
        score = document.querySelectorAll(".opponentScore");
    }
    score.forEach((el) => {
        el.innerHTML++;
    });
};

GameState.prototype.updateMoves = function (player) {
    let moves = null;

    if (player === this.playerType) {
        moves = document.querySelectorAll(".opponentMoves");
    } else {
        moves = document.querySelectorAll(".myMoves");
    }

    moves.forEach((el) => {
        el.innerHTML++;
    });
};

GameState.prototype.showPopup = function (msg) {
    document.querySelector(".popupBackground").style.display = "block";

    if (msg.type === "GAMEOVER") {
        document.querySelector(".stats").style.display = "flex";

        let winner = null;
        if (msg.points["A"] > msg.points["B"]) {
            winner = "A";
        } else if (msg.points["A"] < msg.points["B"]) {
            winner = "B";
        } else {
            winner = "E"; // equal
        }

        const resultText = document.querySelector(".result");

        if (winner === "E") {
            resultText.innerHTML = "Draw";
        } else if (winner === this.playerType) {
            document.querySelector(".popup").style.backgroundColor = "green";
            resultText.innerHTML = "You won";
        } else {
            document.querySelector(".popup").style.backgroundColor = "red";
            resultText.innerHTML = "Opponent won";
        }
    } else {
        // Other player left
        document.querySelector(".opponentQuit").style.display = "block";
    }
};

function CardBoard(gs) {
    this.cards = document.querySelectorAll(".card");

    this.initialize = function (deck) {
        Array.from(this.cards).forEach(function (el, index) {
            el.classList.add(deck[index]);
            el.addEventListener("click", function clicked(e) {
                if (gs.myTurn) {
                    el.classList.toggle("facedown");
                    el.classList.add("selected");
                    gs.guess.push(el.id);

                    const sendMsg = {
                        type: "GUESSED-ONE",
                        data: gs.guess,
                        from: gs.playerType,
                    };

                    if (gs.guess.length >= 2) {
                        // Max guesses reached
                        sendMsg.type = "GUESSED-TWO";
                        gs.myTurn = false;
                        gs.guess = [];
                    }
                    console.log("SSSENDING");
                    gs.socket.send(JSON.stringify(sendMsg));
                } else {
                    console.log("Not my turn.");
                }
            });
        });
    };

    this.eraseGuess = function () {
        Array.from(this.cards).forEach(function (el) {
            if (!el.classList.contains("matched")) {
                el.classList.add("facedown");
            }
            el.classList.remove("selected");
        });
    };

    this.reveal = function (cardID) {
        for (var i = 0; i < cardID.length; i++) {
            const card = document.getElementById(cardID[i]);
            card.classList.remove("facedown");
            card.classList.add("selected");
        }
    };

    this.match = function (cardID) {
        for (var i = 0; i < cardID.length; i++) {
            const card = document.getElementById(cardID[i]);
            card.classList.remove("facedown", "selected");
            card.classList.add("matched");
        }
    };
}

(function setup() {
    const socket = new WebSocket("ws://localhost:3000");

    const gs = new GameState(socket);

    const cb = new CardBoard(gs);

    socket.onmessage = function (event) {
        let msg = JSON.parse(event.data);
        console.log("Received message:");
        console.log(msg);

        if (msg.type === "DECK") {
            console.log("Received DECK");
            cb.initialize(msg.data);
            gs.playerType = msg.playerType;
            gs.setStatus("Waiting for opponent");
        }

        if (msg.type === "GUESSED-ONE") {
            // Receive guess from other player
            cb.reveal(msg.data);
            gs.setStatus("Opponent 1/2 guesses");
        }

        if (msg.type === "GUESSED-TWO") {
            // Receive guess from other player

            gs.updateMoves(msg.from);

            if (msg.match == true) {
                cb.match(msg.data);
                gs.updateScore(msg.from);
                gs.setStatus("Correct guess");
            } else {
                cb.reveal(msg.data);
                gs.setStatus("Incorrect guess");
            }

            setTimeout(function () {
                cb.eraseGuess();
                if (gs.playerType !== msg.from) {
                    gs.myTurn = true;
                    gs.setStatus("Your turn");
                } else {
                    gs.setStatus("Opponents turn");
                }
            }, 3000);
        }

        if (msg.type === "START") {
            gs.myTurn = gs.playerType === "A" ? true : false;
            if (gs.myTurn) {
                cb.eraseGuess();
                gs.setStatus("Your turn");
            } else {
                gs.setStatus("Opponents turn");
            }
        }

        if (msg.type === "GAMEOVER" || msg.type === "ABORTED") {
            gs.showPopup(msg);
            gs.setStatus("Game Over");
        }
    };
})();
