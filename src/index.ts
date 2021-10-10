import e from "express";
import { request } from "http";
import { Game, Player, playerFromString } from "./game-logic/game";

const randomWords = require('random-words');
const express = require('express')
const enableWs = require('express-ws')

const app = express()
enableWs(app)

interface GameSession
{
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
                    // TODO: commit to DB
                }
            }
        }
        
    });

    ws.on('close', () => {
        console.log('WebSocket was closed');
    });
})

app.listen(5000)