import { Avatar, Button, Grid, Typography } from '@mui/material';
import { BrowserRouter, Route, Router, Switch } from 'react-router-dom';
import GameView from './GameView';

function App() {
    return (
        <BrowserRouter>
            <Grid container spacing={2}>
                <Grid item xs={10}>
                    <Button variant="text">Home</Button>
                </Grid>
                <Grid container item xs={2} justifyContent="flex-end">
                    <Button variant="text">
                        Profile
                    </Button>
                </Grid>
            </Grid>
            <Switch>
                <Route path="/">

                </Route>
                <Route path="/play/:id">
                    <GameView>
                        
                    </GameView>
                </Route>
                <Route path="/profile">

                </Route>
            </Switch>
        </BrowserRouter>
    );
}

export default App;
