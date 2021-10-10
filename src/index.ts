import { Game, Player, playerFromString } from "./game-logic/game";
import "./database"

const randomWords = require('random-words');
const express = require('express')
const enableWs = require('express-ws')
const cors = require('cors');

const app = express()
enableWs(app)

interface GameSession
{
    matchId: "",
    blackUsername: string,
    whiteUsername: string,
    blackConnected: boolean,
    blackToken: string,
    whiteConnected: boolean,
    whiteToken: string,
    game: Game,
    started: boolean,
    websockets: any[]
}

let ongoingGames = new Map<string, any>();

const generateToken = (): string => {
    return randomWords(5).join('-');
}

const createSession = (): GameSession => {
    return {
        matchId: "",
        blackUsername: "Anonymous",
        whiteUsername: "Anonymous",
        blackConnected: false,
        whiteConnected: false,
        blackToken: generateToken(),
        whiteToken: generateToken(),
        game: new Game([19, 19]),
        started: false,
        websockets: []
    };
}

const sendJson = (ws: any, object: any) => {
    ws.send(JSON.stringify(object));
}

app.ws('/ws/:id', (ws: any, req: any) => {
    ws.on('message', (msg: any) => {
        if (req.params.id === "offline")
            return;
        
        let session;
        if (ongoingGames.has(req.params.id))
        {
            session = ongoingGames.get(req.params.id);
        }
        else
        {
            session = createSession();
            session.matchId = req.params.id;
            ongoingGames.set(req.params.id, session);
        }
        session.websockets.push(ws);
        console.log(msg);
        msg = JSON.parse(msg);
        if ("request" in msg)
        {
            if (session.started)
            {
                sendJson(ws, {});
                return;
            }
            if (msg.request === Player.Black)
            {
                if (session.blackConnected)
                {
                    sendJson(ws, {
                        player: Player.White,
                        token: session.whiteToken,
                    });
                    session.whiteConnected = true;
                }
                else 
                {
                    sendJson(ws, {
                        player: Player.Black,
                        token: session.blackToken,
                    });
                    session.blackConnected = true;
                }
            }
            else if (msg.request === Player.White)
            {
                if (session.whiteConnected)
                {
                    sendJson(ws, {
                        player: Player.Black,
                        token: session.blackToken,
                    });
                    session.blackConnected = true;
                }
                else 
                {
                    sendJson(ws, {
                        player: Player.White,
                        token: session.whiteToken,
                    });
                    session.whiteConnected = true;
                }
            }
            if (session.whiteConnected && session.blackConnected)
            {
                session.started = true;
            }
        }
        else if ("requestState" in msg)
        {
            sendJson(ws, {
                state: session.game.serializeState()
            })
        }
        else 
        {
            const p = playerFromString(msg.content.split(' ')[0]);
            const expectedToken = (p === Player.Black ? session.blackToken : (p === Player.White ? session.whiteToken : ""));
            if (session.game.getTurn() === p && msg.token === expectedToken)
            {
                const finished = session.game.processMessage(msg.content);
                session.websockets.forEach((sock: any) => {
                    sendJson(sock, {content: msg.content});
                });

                if (finished)
                {
                    console.log("game finished");
                }
            }
        }
        
    });

    ws.on('close', () => {
        console.log('WebSocket was closed');
    });
})

app.get('/active-games', cors(), function (req: any, res: any) {
    res.json(
        Array.from(ongoingGames.values()).filter(sess => !sess.started).map(function (gameSession) {
            const opponentName = gameSession.blackConnected ? gameSession.blackUsername : gameSession.whiteUsername;
            const alreadyPicked = gameSession.blackConnected ? Player.Black : Player.White;
            console.log(gameSession);
            console.log(alreadyPicked);
            return { playerName: opponentName, boardSize: gameSession.game.getBoardSize(), 
                     alreadyPicked: alreadyPicked, scoringRules: gameSession.game.getScoringRules(), 
                     timeControls: null, matchId: gameSession.matchId };
        })
    );
});

app.listen(5000)