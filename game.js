const websocket = require("ws");
const deck = require("./public/javascripts/deck");

const Game = function (gameID) {
    this.playerA = null;
    this.playerB = null;
    this.id = gameID;
    this.guesses = {
        A: 0,
        B: 0,
    };
    this.points = {
        A: 0,
        B: 0,
    };
    this.gameState = "0 PLAYERS";
    this.deck = this.generateDeck();
    this.currentGuess = [];
    this.result = null;
    this.currentTurn = "A";
};

Game.prototype.hasTwoPlayers = function () {
    return this.gameState === "2 PLAYERS";
};

Game.prototype.addPlayer = function (con) {
    // Invalid call
    if (this.gameState != "0 PLAYERS" && this.gameState != "1 PLAYERS") {
        return new Error(
            `Invalid call to addPlayer, current state is ${this.gameState}`
        );
    }

    if (this.gameState === "0 PLAYERS") {
        this.playerA = con;
        this.gameState = "1 PLAYERS";
        return "A";
    } else {
        this.playerB = con;
        this.gameState = "2 PLAYERS";
        return "B";
    }
};

Game.prototype.generateDeck = function () {
    let deck = [
        "apple",
        "banana",
        "grape",
        "kiwi",
        "orange",
        "pineapple",
        "strawberry",
        "watermelon",
    ];
    deck = deck.concat(deck);

    for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }

    return deck;
};

module.exports = Game;
