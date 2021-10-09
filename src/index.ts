import express from "express";
import { Game } from "./game-logic/game";
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3

const game = new Game([19, 19]);
game.playAt({x: 0, y: 0});
game.playAt({x: 1, y: 0});
game.pass();
game.playAt({x: 0, y: 1});
game.pass();
game.playAt({x: 1, y: 1});
game.playAt({x: 2, y: 0});
game.pass();
game.playAt({x: 2, y: 1});
game.pass();
game.playAt({x: 0, y: 2});
game.pass();
game.playAt({x: 1, y: 2});
game.pass();
game.playAt({x: 0, y: 0});

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

// create a GET route
app.get('/express_backend', (req, res) => { //Line 9
  res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Line 10
}); //Line 11
