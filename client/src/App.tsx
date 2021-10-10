import { Button, Grid } from '@mui/material';
import { useState } from 'react';
import { BrowserRouter, Route, Switch, Link } from 'react-router-dom';
import { Player } from './game';
import GameView, { GameMode } from './GameView';
import LobbyView from './LobbyView';
import ProfileView from './ProfileView';

function App() {
    const [gameMode, setGameMode] = useState<GameMode>({requestedColor: Player.Black});

    return (
        <BrowserRouter>
            <Grid container spacing={2} padding={2}>
                <Grid item xs={10}>
                    <Link to="/">Home</Link>
                </Grid>
                <Grid container item xs={2} justifyContent="flex-end">
                    <Link to="/profile">Profile</Link>
                </Grid>
            </Grid>
            <Switch>
                <Route path="/play/:id">
                    <GameView gameMode={gameMode}/>
                </Route>
                <Route path="/profile">
                    <ProfileView />
                </Route>
                <Route path="/">
                    <LobbyView setGameMode={setGameMode}/>
                </Route>
            </Switch>
        </BrowserRouter>
    );
}

export default App;
