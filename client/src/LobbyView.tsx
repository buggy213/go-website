import { Grid, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { ScoringRules, TimeControls } from "./game";

const LobbyView = (props: any) => {
    function createData(playerName: string, boardSize: [number, number], scoringRules: ScoringRules, timeControls: TimeControls) {
        return { playerName, boardSize, scoringRules, timeControls };
      }
    const rows = [
        createData("test", [19, 19], ScoringRules.Territory, {mainTime: 60, byoYomi: 30, periods: 5})
    ];
      
    return (
        <Grid container padding={2} spacing={2}>
            <Grid item xs={12} md={9}>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Player</TableCell>
                                <TableCell align="right">Board Size</TableCell>
                                <TableCell align="right">Scoring Rules</TableCell>
                                <TableCell align="right">Time Controls</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow
                                    key={row.playerName}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    onClick={() => console.log('clicked')}
                                    style={{cursor: "pointer"}}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.playerName}
                                    </TableCell>
                                    <TableCell align="right">{row.boardSize[0]}&times;{row.boardSize[1]}</TableCell>
                                    <TableCell align="right">{ScoringRules[row.scoringRules]}</TableCell>
                                    <TableCell align="right">{row.timeControls.mainTime}+{row.timeControls.byoYomi}({row.timeControls.periods})</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
            <Grid item xs={12} md={3}>
                <Stack spacing={2}>
                    <Button variant="contained">Create a game</Button>
                    <Button variant="contained">Play over the board</Button>
                    <Button variant="contained">Play with the computer</Button>
                </Stack>
            </Grid>
        </Grid>
    );
}

export default LobbyView;