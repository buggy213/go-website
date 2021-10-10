import { Alert, Button, ButtonGroup, Grid, Snackbar, SnackbarCloseReason } from "@mui/material";
import { SyntheticEvent, useEffect, useState } from "react";
import Canvas from "./Canvas";
import { Game, Player, playerFromString, Position } from "./game";
import blackStone from "./black.png"
import whiteStone from "./white.png"
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket"
import ResultModal from "./ResultModal";

function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update the state to force render
}

interface GameMode
{
    requestedColor: Player
}

interface GameViewProps
{
    gameMode: GameMode
}
const GameView = (props: GameViewProps) => {
    let params = useParams<{ id: string }>();

    const [game, setGame] = useState<Game>(new Game([19, 19]));
    const [ghost, setGhost] = useState<Position>({ x: -2, y: -2 });
    const [player, setPlayer] = useState(Player.Empty);
    const [errorMessage, setErrorMessage] = useState("");
    const [online, setOnline] = useState(true);

    let defaultSocketUrl;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')
        defaultSocketUrl = `ws://localhost:5000/ws/${params.id}`;
    else
        defaultSocketUrl = `ws://leiniucsd:5000/ws/${params.id}`

    const [socketUrl, setSocketUrl] = useState(`ws://localhost:5000/ws/${params.id}`);
    const [token, setToken] = useState("");
    const forceUpdate = useForceUpdate();

    const {
        sendJsonMessage,
        lastJsonMessage,
        readyState,
    } = useWebSocket(socketUrl);

    useEffect(() => {
        console.log(params);
        if (params.id === 'offline') {
            setOnline(false);
            setPlayer(Player.Black);
        }
    }, [params]);

    useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            const development = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development');
            const storage = development ? window.sessionStorage : window.localStorage;
            if (!lastJsonMessage) {
                const x = storage.getItem(params.id);
                if (x !== null) {
                    const stored = JSON.parse(x);
                    setToken(stored.token);
                    setPlayer(playerFromString(stored.player));
                    sendJsonMessage({ requestState: stored.token });
                }
                else {
                    console.log(props.gameMode.requestedColor);
                    sendJsonMessage({ request: props.gameMode.requestedColor }); 
                }
                return;
            }
            if ('state' in lastJsonMessage) {
                game.deserializeState(lastJsonMessage.state);
            }
            if ('token' in lastJsonMessage) {
                // initialization
                setToken(lastJsonMessage.token);
                setPlayer(playerFromString(lastJsonMessage.player));
                storage.setItem(params.id, JSON.stringify({
                    token: lastJsonMessage.token,
                    player: lastJsonMessage.player
                }));
            }
            if ('content' in lastJsonMessage) {
                if (lastJsonMessage.content !== game.getLastTurn()) {
                    const finished = game.processMessage(lastJsonMessage.content);
                    if (finished)
                        forceUpdate();
                    setGame(game);
                }
            }
        }
    }, [lastJsonMessage, readyState]);

    const getStone = (color: Player, opacity = 1) => {
        if (color === Player.Black) {
            let img = new Image();
            img.src = blackStone;
            img.style.opacity = opacity.toString();
            return img;
        }
        else if (color === Player.White) {
            let img = new Image();
            img.src = whiteStone;
            img.style.opacity = opacity.toString();
            return img;
        }
        else {
            return new Image();
        }
    }

    const drawBoard = (ctx: any, frameCount: any) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "yellow";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineWidth = 1;
        const boardSize = game!.getBoardSize();
        const horizontalSpacing = ctx.canvas.width / (boardSize[0] + 2);
        const verticalSpacing = ctx.canvas.height / (boardSize[1] + 2);
        ctx.beginPath();
        for (let i = 0; i < boardSize[0] + 1; i++) {
            // columns
            ctx.moveTo((i + 1) * horizontalSpacing, verticalSpacing);
            ctx.lineTo((i + 1) * horizontalSpacing, ctx.canvas.height - verticalSpacing);
        }
        for (let j = 0; j < boardSize[1] + 1; j++) {
            ctx.moveTo(horizontalSpacing, (j + 1) * verticalSpacing);
            ctx.lineTo(ctx.canvas.width - horizontalSpacing, (j + 1) * verticalSpacing);
        }
        ctx.closePath();
        ctx.stroke();

        const getCanvasPosition = (pos: Position) => {
            const canvasX = (pos.x + 0.5) * horizontalSpacing;
            const canvasY = (pos.y + 0.5) * verticalSpacing;
            return [canvasX, canvasY]
        }
        // draw stones, ghost stone
        if (online && player === game.getTurn() && !game.finished()) {
            ctx.drawImage(getStone(player, 0.5), getCanvasPosition(ghost)[0], getCanvasPosition(ghost)[1], horizontalSpacing, verticalSpacing);
        }
        if (!online && !game.finished()) {
            ctx.drawImage(getStone(game.getTurn(), 0.5), getCanvasPosition(ghost)[0], getCanvasPosition(ghost)[1], horizontalSpacing, verticalSpacing);
        }
        const board = game.getBoard();
        for (let i = 0; i < boardSize[1]; i++) {
            for (let j = 0; j < boardSize[0]; j++) {
                if (board[i][j] !== Player.Empty) {
                    ctx.drawImage(getStone(board[i][j]), getCanvasPosition({ x: j, y: i })[0], getCanvasPosition({ x: j, y: i })[1], horizontalSpacing, verticalSpacing);
                }
            }
        }
    }

    const click = (clickEvent: any) => {
        if (!(ghost.x >= 0 && ghost.y >= 0))
            return;

        if (online && player !== game.getTurn())
            return;

        const result = game.playAt(ghost);
        setGame(game);

        if (!result[0]) {
            setErrorMessage(result[1]);
            setOpen(true);
        }
        else {
            sendJsonMessage({
                token: token,
                content: game.getLastTurn()
            });
        }
    }

    const resign = () => {
        if (online && player !== game.getTurn()) // maybe change this later?
            return;
        game.resign(player);
        setGame(game);
        sendJsonMessage({
            token: token,
            content: game.getLastTurn()
        });
    }

    const pass = () => {
        if (online && player !== game.getTurn())
            return;

        game.pass();
        setGame(game);
        sendJsonMessage({
            token: token,
            content: game.getLastTurn()
        });
    }

    const hover = (hoverEvent: any) => {
        const pos = canvasPositionToBoardPosition(hoverEvent.nativeEvent.offsetX, hoverEvent.nativeEvent.offsetY);
        setGhost(pos);
    }

    const exit = (exitEvent: any) => {
        setGhost({ x: -2, y: -2 });
    }

    const canvasPositionToBoardPosition = (x: number, y: number): Position => {
        const canvasSize = 500; // TODO: fix this later
        const boardX = Math.min(game.getBoardSize()[0] - 1, Math.max(0, Math.round((x / (canvasSize / (game.getBoardSize()[0] + 2))) - 1)));
        const boardY = Math.min(game.getBoardSize()[1] - 1, Math.max(0, Math.round((y / (canvasSize / (game.getBoardSize()[1] + 2))) - 1)));
        return { x: boardX, y: boardY };
    }

    const [open, setOpen] = useState(false);

    const handleClose = (event: SyntheticEvent<Element, Event>, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };


    return (
        <Grid container spacing={2} padding={2}>
            <Grid container md={9} xs={12} justifyContent="flex-end">
                <Grid item>
                    <Canvas draw={drawBoard} clickHandler={click} hoverHandler={hover} exitHandler={exit} />
                </Grid>
            </Grid>
            <Grid item md={3} xs={12}>
                <ButtonGroup variant="contained">
                    <Button onClick={pass}>Pass</Button>
                    <Button onClick={resign}>Resign</Button>
                </ButtonGroup>
            </Grid>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
            {game.finished() ? <ResultModal resultsString={game.getResults()} /> : null}
        </Grid>
    );
}

export default GameView;
export type {
    GameMode
}