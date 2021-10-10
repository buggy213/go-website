import { Grid, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { ScoringRules, TimeControls, Player, playerFromString, opposite } from "./game";
import { GameMode } from "./GameView";

interface LobbyViewProps {
    setGameMode: (gameMode: GameMode) => void
}

const paperStyle = {
    width: "80px",
    height: "80px",
    display: "flex",
    "justify-content": "center",
    "align-items": "center",
    cursor: "pointer",
};
const spanStyle = {
    fontSize: "xx-large",
    cursor: "pointer"
}

const randomColor = () => {
    return Math.random() < 0.5 ? Player.Black : Player.White;
}

const randomWords = require('random-words');
const generateToken = (): string => {
    return randomWords(5).join('-');
}

const LobbyView = (props: LobbyViewProps) => {
    const history = useHistory();
    const handleOnClick = (matchId: string) => history.push(`play/${matchId}`)

    const [rows, setRows] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [boardSize, setBoardSize] = useState<[number, number]>([19, 19]);

    useEffect(() => {
        fetch('/active-games').then(response => response.json()).then(responseObject => {
            setRows(responseObject);
        });
    }, []);

    const handleClose = (requestedColor: Player) => {
        setOpen(false);
        enterGame(requestedColor, generateToken());
    }

    const enterGame = (requestedColor: Player, matchId: string) => {
        props.setGameMode({requestedColor: requestedColor});
        handleOnClick(matchId);
    }

    return (
        <Grid container padding={2} spacing={2}>
            <Grid item xs={12} md={9}>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    Player
                                </TableCell>
                                <TableCell align="right">Board Size</TableCell>
                                <TableCell align="right">Scoring Rules</TableCell>
                                <TableCell align="right">Time Controls</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows && rows.map((row: any) => (
                                <TableRow
                                    key={row.playerName}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    onClick={() => enterGame(opposite(row.alreadyPicked), row.matchId)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.alreadyPicked === Player.Black ? '●' : '○'} {row.playerName}
                                    </TableCell>
                                    <TableCell align="right">{row.boardSize[0]}&times;{row.boardSize[1]}</TableCell>
                                    <TableCell align="right">{ScoringRules[row.scoringRules]}</TableCell>
                                    <TableCell align="right">
                                        {row.timeControls !== null ? `${row.timeControls.mainTime}+${row.timeControls.byoYomi}(${row.timeControls.periods})` : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            <Grid item xs={12} md={3}>
                <Stack spacing={2}>
                    <Button variant="contained" onClick={() => setOpen(true)}>
                        Create a game
                    </Button>
                    <Button variant="contained"
                        onClick={() => window.location.href += 'play/offline'}>
                        Play over the board
                    </Button>
                    <Button disabled variant="contained">Play with the computer</Button>
                </Stack>
            </Grid>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>New Game</DialogTitle>
                <DialogContent>
                    <Stack sx={{ padding: "5px" }} spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel id="board-size-label">Board Size</InputLabel>
                            <Select
                                labelId="board-size-label"
                                id="board-size-select"
                                value={boardSize[0]}
                                label="Board Size"
                            >
                                <MenuItem value={19}>19&times;19</MenuItem>
                            </Select>
                        </FormControl>
                        <Stack direction="row" spacing={2}>
                            <Paper sx={paperStyle} onClick={() => handleClose(Player.Black)}>
                                <span style={spanStyle}>●</span>
                            </Paper>
                            <Paper sx={paperStyle} onClick={() => handleClose(randomColor())}>
                                <span style={spanStyle}>◐</span>
                            </Paper>
                            <Paper sx={paperStyle} onClick={() => handleClose(Player.White)}>
                                <span style={spanStyle}>○</span>
                            </Paper>
                        </Stack>
                    </Stack>

                </DialogContent>
            </Dialog>
        </Grid>
    );
}

export default LobbyView;